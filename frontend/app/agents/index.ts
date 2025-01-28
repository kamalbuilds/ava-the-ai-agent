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
import { defiLlamaToolkit , coingeckoTool, coinbaseDevToolkit } from "./tools";
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
    const cdpTools = await coinbaseDevToolkit.setup({ walletData });

    // CDP Management Agent
    const coinbaseAgent = await createAgent({
        ...baseOptions,
        tools: [
            ...cdpTools,
            defiLlamaToolkit.getTVLTool,
            coingeckoTool,
        ],
        instructions: `You are a Coinbase Developer Platform (CDP) specialist.
            
            Available Operations:
            - Swap tokens on supported DEXs
            - Bridge assets across chains
            - Deposit/Withdraw from DeFi protocols
            - Transfer tokens between addresses
            - Check token balances
            - Deploy NFTs and ERC-20 tokens
            
            Supported Networks:
            - Base (primary)
            - Ethereum
            - Optimism
            - Arbitrum
            
            Integration Features:
            - Price monitoring via CoinGecko
            - Protocol analytics via DeFiLlama
            - Cross-chain operations
            - Gas optimization
            
            Always prioritize:
            - Transaction safety
            - Gas efficiency
            - Clear operation explanations
            - Risk warnings for complex operations`,
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
            id: 'coinbase-dev',
            name: 'Coinbase Dev Agent',
            description: 'Executes defi operations via Coinbase CDP',
            agent: coinbaseAgent,
            metadata: {
                supportedChains: ["base", "ethereum", "optimism", "arbitrum"],
                capabilities: [
                    "swap", "bridge", "deposit", "withdraw",
                    "transfer", "balance", "deploy"
                ]
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