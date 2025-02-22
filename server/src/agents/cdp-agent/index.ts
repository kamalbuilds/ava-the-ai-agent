import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { Coinbase } from "@coinbase/coinbase-sdk";
import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { IPAgent } from "../types/ip-agent";
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
import { RecallStorage } from "../plugins/recall-storage";
import { ATCPIPProvider } from "../plugins/atcp-ip";
import type { IPLicenseTerms, IPMetadata } from "../types/ip-agent";

// Arbitrium Track
export class CdpAgent extends IPAgent {
  private agent: any;
  private config: any;

  constructor(
    name: string, 
    eventBus: EventBus,
    recallStorage: RecallStorage,
    atcpipProvider: ATCPIPProvider
  ) {
    super(name, eventBus, recallStorage, atcpipProvider);
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

        // License the agent's response
        const responseLicenseTerms: IPLicenseTerms = {
          name: `CDP Agent Response - ${Date.now()}`,
          description: "License for CDP agent's response to user message",
          scope: 'commercial',
          transferability: true,
          onchain_enforcement: true,
          royalty_rate: 0.05
        };

        const licenseId = await this.mintLicense(responseLicenseTerms, {
          issuer_id: this.name,
          holder_id: 'user',
          issue_date: Date.now(),
          version: '1.0'
        });

        // Store response with license
        await this.storeIntelligence(`response:${Date.now()}`, {
          message: responseMessage,
          licenseId,
          timestamp: Date.now()
        });

      } else if ("tools" in chunk) {
        responseMessage = chunk.tools.messages[0].content;

        // License the tool result
        const toolResultLicenseTerms: IPLicenseTerms = {
          name: `CDP Tool Result - ${Date.now()}`,
          description: "License for CDP tool execution result",
          scope: 'commercial',
          transferability: true,
          onchain_enforcement: true,
          royalty_rate: 0.05
        };

        const licenseId = await this.mintLicense(toolResultLicenseTerms, {
          issuer_id: this.name,
          holder_id: 'user',
          issue_date: Date.now(),
          version: '1.0'
        });

        // Store tool result with license
        await this.storeIntelligence(`tool:${Date.now()}`, {
          result: responseMessage,
          licenseId,
          timestamp: Date.now()
        });
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

    if (text) {
      // Store chain of thought with license
      const thoughtLicenseTerms: IPLicenseTerms = {
        name: `CDP Chain of Thought - ${Date.now()}`,
        description: "License for CDP agent's chain of thought",
        scope: 'commercial',
        transferability: true,
        onchain_enforcement: true,
        royalty_rate: 0.05
      };

      const licenseId = await this.mintLicense(thoughtLicenseTerms, {
        issuer_id: this.name,
        holder_id: 'user',
        issue_date: Date.now(),
        version: '1.0'
      });

      await this.storeChainOfThought(`thought:${Date.now()}`, [text], {
        toolCalls: toolCalls || [],
        toolResults: toolResults || [],
        licenseId
      });
    }
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
