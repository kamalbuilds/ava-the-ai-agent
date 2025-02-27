import {
  AgentKit,
  cdpApiActionProvider,
  erc20ActionProvider,
  NETWORK_ID_TO_VIEM_CHAIN,
  pythActionProvider,
  ViemWalletProvider,
  walletActionProvider,
  wethActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ChatGroq } from "@langchain/groq";
import { defiActionProvider } from "./actions/DefiAction";
import { cowSwapActionProvider } from "./actions/CowSwap";

import dotenv from "dotenv";
dotenv.config();

const getOrInitializeAgent = async (): Promise<
  ReturnType<typeof createReactAgent>
> => {
  let agent: ReturnType<typeof createReactAgent>;

  try {
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const account = privateKeyToAccount(
      process.env.PRIVATE_KEY as `0x${string}`
    );
    const networkId = process.env.NETWORK_ID as string;
    const client = createWalletClient({
      account,
      chain: NETWORK_ID_TO_VIEM_CHAIN[networkId],
      transport: http(),
    });
    const walletProvider = await new ViemWalletProvider(client);

    // Initialize AgentKit: https://docs.cdp.coinbase.com/agentkit/docs/agent-actions
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        defiActionProvider(),
        cowSwapActionProvider(),
        // The CDP API Action Provider provides faucet functionality on base-sepolia. Can be removed if you do not need this functionality.
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
        }),
      ],
    });
    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();

    // Initialize Agent
    const canUseFaucet =
      walletProvider.getNetwork().networkId == "base-sepolia";
    const faucetMessage = `If you ever need funds, you can request them from the faucet.`;
    const cantUseFaucetMessage = `If you need funds, you can provide your wallet details and request funds from the user.`;
    agent = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: memory,
      messageModifier: `
              You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
              empowered to interact onchain using your tools. ${
                canUseFaucet ? faucetMessage : cantUseFaucetMessage
              }.
              Before executing your first action, get the wallet details to see what network 
              you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
              asks you to do something you can't do with your currently available tools, you must say so, and 
              encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
              docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
              restating your tools' descriptions unless it is explicitly requested.
              `,
    });

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
};

export { getOrInitializeAgent };
