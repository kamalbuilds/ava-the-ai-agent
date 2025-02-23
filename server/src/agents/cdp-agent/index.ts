import { Agent } from "../agent";
import type { EventBus } from "../../comms";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
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
import { MemorySaver } from "@langchain/langgraph";
import { wormholeActionProvider } from "./action-providers/customActionProvider";
import env from "../../env";

export class CdpAgent extends Agent {
  private agent: ReturnType<typeof createReactAgent>;

  constructor(name: string, eventBus: EventBus) {
    super(name, eventBus);
  }

  async initialize() {
    const agent = await this.initializeAgent();
    this.agent = agent;
  }

  async handleEvent(event: string, data: any): Promise<void> {
    // Handle events from other agents
    console.log(`CDP Agent handling event: ${event}`);
  }

  private async initializeAgent(): Promise<
    ReturnType<typeof createReactAgent>
  > {
    try {
      // Initialize LLM: https://platform.openai.com/docs/models#gpt-4o
      // const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

      const llm = new ChatGroq({
        apiKey: env.GROQ_API_KEY,
      });

      const account = privateKeyToAccount(
        env.WALLET_PRIVATE_KEY as `0x${string}`
      );
      const networkId = "base-sepolia"; //TODO: we can change this to the env network Id
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
          wormholeActionProvider(),
          wethActionProvider(),
          pythActionProvider(),
          walletActionProvider(),
          erc20ActionProvider(),
          // The CDP API Action Provider provides faucet functionality on base-sepolia. Can be removed if you do not need this functionality.
          cdpApiActionProvider({
            apiKeyName: env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY,
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
      const agent = createReactAgent({
        llm,
        tools,
        checkpointSaver: memory,
        messageModifier: `
          You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
          empowered to interact onchain using your tools. ${canUseFaucet ? faucetMessage : cantUseFaucetMessage}.
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
  }

  async getAgentRespinse(userMessage: string) {
    if (!this.agent) {
      this.initialize();
    }
    const stream = await this.agent.stream(
      { messages: [{ content: userMessage, role: "user" }] }, // The new message to send to the agent
      { configurable: { thread_id: "AgentKit Discussion" } } // Customizable thread ID for tracking conversations
    );

    // 4️. Process the streamed response chunks into a single message
    let agentResponse = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        agentResponse += chunk.agent.messages[0].content;
      }
    }
    return agentResponse;
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    console.log(
      `[cdp-agent] step finished. tools called: ${
        toolCalls?.length > 0
          ? toolCalls.map((tool: any) => tool.toolName).join(", ")
          : "none"
      }`
    );
  }
}
