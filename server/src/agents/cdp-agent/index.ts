import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { IPAgent } from "../types/ip-agent";
import type { EventBus } from "../../comms";
import env from "../../env";
import { RecallStorage } from "../plugins/recall-storage";
import { ATCPIPProvider } from "../plugins/atcp-ip";
import type { IPLicenseTerms, IPMetadata } from "../types/ip-agent";
import { AIProvider, Tool } from "../../services/ai/types";
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
import { cowSwapActionProvider } from "./actions/CowSwap.action";
import { wormholeActionProvider } from "./actions/Wormhole.action";
import { defiActionProvider } from "./actions/Defi.action";
export class CdpAgent extends IPAgent {
  private agent: ReturnType<typeof createReactAgent> | undefined;
  public eventBus: EventBus;
  private taskResults: Map<string, any>;
  public aiProvider?: AIProvider;

  constructor(
    name: string,
    eventBus: EventBus,
    recallStorage: RecallStorage,
    atcpipProvider: ATCPIPProvider,
    aiProvider?: AIProvider
  ) {
    super(name, eventBus, recallStorage, atcpipProvider);

    this.eventBus = eventBus;
    this.taskResults = new Map();
    this.aiProvider = aiProvider;

    this.initialize();

    // Setup event handlers
    this.setupEventHandlers();

  }

  async initialize() {
    const agent = await initializeAgent();
    console.log(`[CDP Agent] Agentkit Initialized `);
    this.agent = agent;
  }

  private setupEventHandlers(): void {
    this.eventBus.on('cdp-agent', async (data: any) => {
      console.log(`[${this.name}] Received event:`, data);
    });

    // Also keep the original event handler for backward compatibility
    this.eventBus.register(`task-manager-agentkit`, (data) =>
      this.handleEvent(`task-manager-agentkit`, data)
    );
  }

  async handleEvent(event: string, data: any): Promise<void> {
    // Handle events from other agents
    console.log(`[${this.name}] Received event: ${event}`, data);

    if (event === 'task-manager-agentkit') {
      await this.handleTaskManagerRequest(data);
    }
  }

  private async handleTaskManagerRequest(data: any): Promise<void> {
    const { taskId, task, type } = data;

    if (!taskId) {
      console.error(`[${this.name}] No taskId provided in the request`);
      return;
    }

    try {
      console.log(`[${this.name}] Processing task: ${task}`);

      // Parse the task to determine what Hedera operation to perform
      const result = await this.executeTask(task);

      // Store the result
      this.taskResults.set(taskId, result);

      // Send the result back to the task manager
      this.eventBus.emit('agentkit-task-manager', {
        taskId,
        result,
        status: 'completed'
      });

    } catch (error: any) {
      console.error(`[${this.name}] Error processing task:`, error);

      // Send error back to task manager
      this.eventBus.emit('hedera-task-manager', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      });
    }
  }

  private async executeTask(task: string): Promise<any> {
    // If we have AI provider, we can use it to parse the task
    if (this.aiProvider) {
      // Use AI to determine the operation and parameters
      const { operation, params } = await this.parseTaskWithAI(task);

      const response = this.processMessage(task)
      console.log("Response from the cdp agent 1>>>", response);

      return response

      // return this.executeOperation(operation, params);
    } else {
      // Simple parsing logic for direct commands
      try {
        const taskObj = JSON.parse(task);
        // return this.executeOperation(taskObj.operation, taskObj.params);

        const response = this.processMessage(taskObj)
        console.log("Response from the cdp agent 2>>>", response);

        return response


      } catch (error: unknown) {
        throw new Error(`Invalid task format: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async parseTaskWithAI(task: string): Promise<{ operation: string, params: any }> {
    // This would use the AI provider to parse natural language into structured operations
    // For now, we'll implement a simple version
    try {
      return JSON.parse(task);
    } catch (error: unknown) {
      throw new Error(`Failed to parse task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processMessage(message: string) {
    if (!this.agent) {
      throw new Error("CDP Agent not initialized");
    }
    const stream = await this.agent.stream(
      { messages: [{ role: "user", content: message }] },
      { configurable: { thread_id: "AgentKit Discussion" } }
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

  const account = privateKeyToAccount(
    env.PRIVATE_KEY as `0x${string}`
  );

  const networkId = env.NETWORK_ID

  const client = createWalletClient({
    account,
    chain: NETWORK_ID_TO_VIEM_CHAIN[networkId],
    transport: http(),
  });
  const walletProvider = await new ViemWalletProvider(client);

  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      wethActionProvider(),
      pythActionProvider(),
      walletActionProvider(),
      erc20ActionProvider(),
      defiActionProvider(),
      cowSwapActionProvider(),
      wormholeActionProvider(),
      // The CDP API Action Provider provides faucet functionality on base-sepolia. Can be removed if you do not need this functionality.
      cdpApiActionProvider({
        apiKeyName: env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: env.CDP_API_KEY_PRIVATE_KEY,
      }),
    ],
  });

  const tools = await getLangChainTools(agentkit);
  const memory = new MemorySaver();

  const agent = createReactAgent({
    llm: groqModel,
    tools,
    checkpointSaver: memory,
    messageModifier: `
            You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
            empowered to interact onchain using your tools.
            Remember to use:
            - Cow Swap when user asks to swap/change/exchage from one token to another token.
            - Wormhole Transfer and Redeem when user asks to bridge or transfer native token from one chain to another Chain.
            Before executing your first action, get the wallet details to see what network 
            you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. 
            If user ask for some action that is not mentioned or tools that is not present ask the user to try something else.
            `,
  });

  return agent;

}
