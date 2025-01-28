import {
    type BrianAgentOptions,
    BrianToolkit,
    XMTPCallbackHandler,
} from "@brian-ai/langchain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { ChatXAI } from "@langchain/xai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatMessageHistory } from "langchain/memory";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { FunctorService } from '../services/functorService';
import { defiLlamaToolkit , coingeckoTool, brianCDPToolkit } from "./tools";
import { ChainValues } from "@langchain/core/utils/types";
import * as ethers from "ethers";

// Update message history store and getter
const store: Record<string, ChatMessageHistory> = {};

function getMessageHistory(sessionId: string): ChatMessageHistory {
    if (!(sessionId in store)) {
        store[sessionId] = new ChatMessageHistory();
    }
    return store[sessionId]!;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    agent: RunnableWithMessageHistory<Record<string, any>, ChainValues>;
    metadata?: Record<string, any>;
}

export const createSpecializedAgents = async (baseOptions: BrianAgentOptions): Promise<Agent[]> => {
    // Trading Agent with Kestra orchestration
    const tradingAgent = await createAgent({
        ...baseOptions,
        tools: [ coingeckoTool],
        instructions: `You are a specialized trading agent with workflow orchestration capabilities.
            You can execute and monitor complex trading operations using Kestra workflows.
            Focus on price analysis and trading opportunities.`,
    });

    // Liquidity Pool Agent
    const liquidityAgent = await createAgent({
        ...baseOptions,
        tools: [defiLlamaToolkit.getTVLTool],
        instructions: "You are a liquidity pool specialist. Help users find and analyze liquidity pools.",
    });

    // DeFiLlama Analysis Agent
    const defiLlamaAgent = await createAgent({
        ...baseOptions,
        tools: Object.values(defiLlamaToolkit),
        instructions: `You are a DeFi analytics specialist powered by DeFiLlama data.
            You can:
            - Track TVL across protocols and chains
            - Analyze yield opportunities and APY trends
            - Monitor DEX volumes and trading activity
            - Compare different protocols and chains
            Always provide data-driven insights and recommendations.`,
    });

    // Update Portfolio Agent with orchestration capabilities
    const portfolioAgent = await createAgent({
        ...baseOptions,
        tools: [
            coingeckoTool,
            defiLlamaToolkit.getTVLTool,
        ],
        instructions: `You are a portfolio management specialist with cross-chain orchestration capabilities.
            You can orchestrate complex portfolio operations across multiple chains.
            Help users optimize their portfolio allocation while maintaining efficiency and security.`
    });

    // Initialize CDP toolkit with wallet
    const walletData = await initializeCDPWallet(baseOptions);
    const cdpTools = await brianCDPToolkit.setup({ 
        walletData,
        // config: {
        //     defaultCollateralRatio: 200,
        //     liquidationThreshold: 150,
        //     maxDebtPerPosition: ethers.utils.parseEther("10000"),
        //     supportedCollateral: ["ETH", "WBTC", "LINK"]
        // }
    });

    // CDP Management Agent
    const cdpAgent = await createAgent({
        ...baseOptions,
        tools: [
            ...cdpTools,
            defiLlamaToolkit.getTVLTool, // Add TVL monitoring
            coingeckoTool, // Add price monitoring
        ],
        instructions: `You are a CDP (Collateralized Debt Position) management specialist on Coinbase Base.
            
            Core Capabilities:
            - Create and manage CDPs with optimal collateral ratios
            - Monitor position health and liquidation risks
            - Provide automated risk alerts
            - Execute collateral/debt adjustments
            - Analyze market conditions for CDP management
            
            Safety Guidelines:
            - Maintain minimum 200% collateral ratio
            - Alert users at 150% ratio
            - Consider market volatility when suggesting positions
            - Maximum debt per position: 10,000 USD
            - Supported collateral: ETH, WBTC, LINK
            
            Integration Features:
            - Monitor asset prices via CoinGecko
            - Track protocol TVL via DeFiLlama
            - Automate position adjustments
            - Provide real-time risk notifications
            
            Always prioritize risk management and provide clear explanations for recommendations.`,
    });

    // Helper function to initialize CDP wallet
    async function initializeCDPWallet(options: BrianAgentOptions) {
        try {
            // Create or import wallet based on private key
            const wallet = new ethers.Wallet(
                options.privateKeyOrAccount,
                new ethers.providers.JsonRpcProvider(
                    process.env["NEXT_PUBLIC_BASE_RPC_URL"]
                )
            );

            // Return wallet data in expected format
            return {
                address: wallet.address,
                privateKey: wallet.privateKey,
                provider: "base",
                chainId: 8453 // Base mainnet
            };
        } catch (error) {
            console.error("Failed to initialize CDP wallet:", error);
            throw error;
        }
    }

    return [
        {
            id: 'trading',
            name: 'Trading Agent',
            description: 'Specializes in price analysis and trading opportunities',
            agent: tradingAgent
        },
        {
            id: 'liquidity',
            name: 'Liquidity Pool Agent',
            description: 'Analyzes liquidity pools and provides insights',
            agent: liquidityAgent
        },
        {
            id: 'portfolio',
            name: 'Portfolio Manager',
            description: 'Helps optimize portfolio allocation and management',
            agent: portfolioAgent
        },
        {
            id: 'defi-analytics',
            name: 'DeFi Analytics',
            description: 'Provides comprehensive DeFi market analysis using DeFiLlama data',
            agent: defiLlamaAgent
        },
        {
            id: 'cdp',
            name: 'CDP Manager',
            description: 'Manages Coinbase Base CDPs with automated risk monitoring',
            agent: cdpAgent,
            metadata: {
                network: 'base',
                supportedCollateral: ["ETH", "WBTC", "LINK"],
                minCollateralRatio: 200,
                alertThreshold: 150
            }
        }
    ];
};

// Base Agent Creation Function
const createAgent = async ({
    apiKey,
    privateKeyOrAccount,
    llm,
    tools = [],
    instructions,
    apiUrl,
    xmtpHandler,
    xmtpHandlerOptions,
}: BrianAgentOptions & { tools?: Array<DynamicStructuredTool<any>> }) => {

    const brianToolkit = new BrianToolkit({
        apiKey,
        privateKeyOrAccount,
        ...(apiUrl ? { apiUrl } : {})
    });

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", instructions || ""],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);

    // Initialize Functor Network integration
    const functorTools = [
        new DynamicStructuredTool({
            name: "create_smart_account",
            description: "Create a smart account using Functor Network",
            schema: z.object({
                owner: z.string(),
                recoveryMechanism: z.array(z.string()),
                paymaster: z.string()
            }),
            func: async ({ owner, recoveryMechanism, paymaster }) => {
                return await FunctorService.createSmartAccount({
                    owner,
                    recoveryMechanism,
                    paymaster
                });
            }
        }),
        // Add more Functor-specific tools as needed
    ];

    const agent = createToolCallingAgent({
        llm,
        tools: [...tools, ...functorTools, ...brianToolkit.tools],
        prompt,
    });

    const agentExecutor = new AgentExecutor({
        agent,
        tools: [...tools, ...functorTools, ...brianToolkit.tools],
        callbacks: xmtpHandler
            ? [new XMTPCallbackHandler(xmtpHandler, llm, instructions!, xmtpHandlerOptions)]
            : [],
    });

    return new RunnableWithMessageHistory({
        runnable: agentExecutor,
        getMessageHistory,
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });
};


export const initializeAgents = async () => {
    const baseOptions = {
        apiKey: process.env["NEXT_PUBLIC_BRIAN_API_KEY"]!,
        privateKeyOrAccount: process.env["NEXT_PUBLIC_PRIVATE_KEY"] as `0x${string}`,
        llm: new ChatOpenAI({
            apiKey: process.env["NEXT_PUBLIC_OPENAI_API_KEY"]!,
        }),
    };

    const agents = await createSpecializedAgents(baseOptions);
    return agents;
}; 