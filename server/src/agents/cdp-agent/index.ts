import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { Coinbase } from "@coinbase/coinbase-sdk";
import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Agent } from "../agent";
import type { EventBus } from "../../comms";
import env from "../../env";
import {
  SIGN_MESSAGE_PROMPT,
  signMessage,
  SignMessageInput,
} from "./actions/sign_message";
import {
  CREATE_PREDICTION_MESSAGE,
  createPrediction,
  CreatePredictionInput,
} from "./actions/create_prediction";

export class CdpAgent extends Agent {
  private agent: any;
  private config: any;

  constructor(name: string, eventBus: EventBus) {
    super(name, eventBus);
  }

  async initialize() {
    const { agent, config } = await initializeAgent();
    this.agent = agent;
    this.config = config;
  }

  async handleEvent(event: string, data: any): Promise<void> {
    // Handle events from other agents
    console.log(`CDP Agent handling event: ${event}`);
  }

  async processMessage(message: string) {
    if (!this.agent) {
      throw new Error("CDP Agent not initialized");
    }
    const stream = await this.agent.stream(
      { messages: [{ role: "user", content: message }] },
      this.config
    );

    let responseMessage = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        responseMessage = chunk.agent.messages[0].content;
      } else if ("tools" in chunk) {
        responseMessage = chunk.tools.messages[0].content;
      }
    }

    console.log(responseMessage, "response message");
    return responseMessage;
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    console.log(
      `[cdp-agent] step finished. tools called: ${toolCalls?.length > 0
        ? toolCalls.map((tool: any) => tool.toolName).join(", ")
        : "none"
      }`
    );
  }
}

/**
 * Initialize the agent with CDP AgentKit
 *
 * @returns Agent executor and config
 */
export async function initializeAgent() {
  //   Initialize LLM
  const groqModel = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
  });

  const apiKeyName = env.CDP_API_KEY_NAME;
  const apiKeyPrivateKey = env.CDP_API_KEY_PRIVATE_KEY;

  Coinbase.configure({
    apiKeyName,
    privateKey: apiKeyPrivateKey,
  });

  // Configure CDP AgentKit
  const walletDataConfig = {
    networkId: env.NETWORK_ID || "base-sepolia",
    mnemonicPhrase: env.MNEMONIC_PHRASE,
  };

  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(walletDataConfig);

  // Initialize CDP AgentKit Toolkit and get tools
  const cdpToolkit = new CdpToolkit(agentkit);
  const tools = cdpToolkit.getTools();

  const signMessageTool = new CdpTool(
    {
      name: "Sign Message",
      description: SIGN_MESSAGE_PROMPT,
      argsSchema: SignMessageInput,
      func: signMessage,
    },
    agentkit
  );
  tools.push(signMessageTool);

  const PredictionTool = new CdpTool(
    {
      name: "Create Prediction",
      description: CREATE_PREDICTION_MESSAGE,
      argsSchema: CreatePredictionInput,
      func: createPrediction,
    },
    agentkit
  );
  tools.push(PredictionTool);

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "CDP AgentKit Chatbot" },
  };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm: groqModel,
    tools,
    checkpointSaver: memory,
    messageModifier: "You are AI Agent built by Coinbase Developer Agent Kit",
  });

  return { agent, config: agentConfig };
}
