import { Agent } from "../agent";
import { EventBus } from "../../comms";
import { AIProvider } from "../../services/ai/types";
import { HederaAgentKit } from "hedera-agent-kit";
// Import the toolkit function type
import type { Tool } from "../../services/ai/types";
import { getHederaAgentToolkit } from './toolkit';

interface HederaAgentConfig {
  accountId: string;
  privateKey: string;
  network: 'mainnet' | 'testnet' | 'previewnet';
}

/**
 * @dev Mock Hedera Agent Kit for development
 */
 
/**
 * @dev The Hedera agent is responsible for interacting with the Hedera network
 */
export class HederaAgent extends Agent {
  public eventBus: EventBus;
  private tools: Record<string, Tool>;
  private taskResults: Map<string, any>;
  public aiProvider?: AIProvider;
  private hederaKit: any; // Using any type to avoid TypeScript errors

  constructor(
    name: string,
    eventBus: EventBus,
    config: HederaAgentConfig,
    aiProvider?: AIProvider
  ) {
    super(name, eventBus, aiProvider);
    
    this.eventBus = eventBus;
    this.taskResults = new Map();
    this.aiProvider = aiProvider;
    
    // Initialize Hedera Kit - using dynamic import to handle ESM module
    this.initializeHederaKit(config);
    
    // Initialize tools
    this.tools = getHederaAgentToolkit(this.hederaKit);
    
    // Setup event handlers
    this.setupEventHandlers();
    
    console.log(`[HederaAgent] initialized with account: ${config.accountId} on ${config.network}`);
  }

  private async initializeHederaKit(config: HederaAgentConfig): Promise<void> {
    try {
      // Dynamic import for ESM module
    //   const HederaAgentKit = await import('hedera-agent-kit');
      this.hederaKit = new HederaAgentKit(
        config.accountId,
        config.privateKey,
        config.network
      );

      console.log('[HederaAgent] Hedera Kit initialized');
    } catch (error) {
      console.error('[HederaAgent] Failed to initialize Hedera Kit:', error);
      // Initialize with a mock object if import fails
      this.hederaKit = {
        createFT: async () => { throw new Error('Hedera Kit not initialized properly'); },
        transferToken: async () => { throw new Error('Hedera Kit not initialized properly'); },
        getHbarBalance: async () => { throw new Error('Hedera Kit not initialized properly'); },
        createTopic: async () => { throw new Error('Hedera Kit not initialized properly'); },
        submitTopicMessage: async () => { throw new Error('Hedera Kit not initialized properly'); },
      };
    }
  }

  private setupEventHandlers(): void {
    this.eventBus.on('hedera-agent', async (data: any) => {
      console.log(`[${this.name}] Received event:`, data);
      
      if (data.action === 'process-task' && data.task) {
        await this.processTask(data.task);
      }
    });
    
    // Also keep the original event handler for backward compatibility
    this.eventBus.register(`task-manager-hedera`, (data) => 
      this.handleEvent(`task-manager-hedera`, data)
    );
  }

  async handleEvent(event: string, data: any): Promise<void> {
    console.log(`[${this.name}] Received event: ${event}`, data);
      
    if (event === 'task-manager-hedera') {
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
      this.eventBus.emit('hedera-task-manager', {
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
      return this.executeOperation(operation, params);
    } else {
      // Simple parsing logic for direct commands
      try {
        const taskObj = JSON.parse(task);
        return this.executeOperation(taskObj.operation, taskObj.params);
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

  private async executeOperation(operation: string, params: any): Promise<any> {
    if (!this.tools[operation]) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    
    try {
      return await this.tools[operation].execute(params);
    } catch (error: unknown) {
      throw new Error(`Failed to execute ${operation}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    // This method is called when an AI step finishes
    // We can use it to process AI-generated operations
    console.log(`[${this.name}] Step finished: ${text}`);
    
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        try {
          const result = await this.executeOperation(toolCall.name, toolCall.args);
          console.log(`[${this.name}] Tool execution result:`, result);
        } catch (error) {
          console.error(`[${this.name}] Tool execution error:`, error);
        }
      }
    }
  }
  
  // New methods for handling direct task processing
  private async processTask(task: any): Promise<void> {
    console.log(`[${this.name}] Processing task: ${task.id}`);
    console.log(`[${this.name}] Task description: ${task.description}`);
    
    const description = task.description.toLowerCase();
    
    try {
      // Handle Hedera balance query
      if (description.includes('hedera balance')) {
        await this.handleBalanceQuery(task);
        return;
      }
      
      // Handle other Hedera-related queries
      // Add more specific handlers as needed
      
      // Default response for general Hedera queries
      this.sendTaskResult(task.id, {
        message: "I can help with Hedera operations like creating tokens, checking balances, and managing topics. Please specify what Hedera operation you'd like to perform.",
        status: 'completed'
      });
      
    } catch (error: any) {
      console.error(`[${this.name}] Error processing task:`, error);
      this.sendTaskResult(task.id, {
        error: `Failed to process Hedera task: ${error.message}`,
        status: 'failed'
      });
    }
  }
  
  private async handleBalanceQuery(task: any): Promise<void> {
    console.log(`[${this.name}] Handling Hedera balance query`);
    
    try {
      // Get the account ID from the Hedera Kit
      const accountId = this.hederaKit.accountId;
      
      // Try to get the actual balance if possible
      let balanceInfo = "Unable to retrieve balance at this time.";
      try {
        const balance = await this.hederaKit.getHbarBalance();
        balanceInfo = `Your current HBAR balance is: ${balance} HBAR`;
      } catch (error) {
        console.error(`[${this.name}] Error getting balance:`, error);
      }
      
      // Send a response about the Hedera balance
      this.sendTaskResult(task.id, {
        message: `I've checked your Hedera account information. ${balanceInfo}\n\nYour Hedera account ID is: ${accountId}\n\nYou can also check your balance using the Hedera Explorer at https://hashscan.io/${this.hederaKit.network}/account/${accountId}`,
        status: 'completed',
        result: {
          title: "Hedera Balance Information",
          accountId: accountId,
          network: this.hederaKit.network,
          balanceInfo: balanceInfo,
          explorerLink: `https://hashscan.io/${this.hederaKit.network}/account/${accountId}`
        }
      });
      
      // Send a direct message to the frontend
      this.eventBus.emit('agent-message', {
        type: 'agent-message',
        role: 'assistant',
        content: `I've checked your Hedera account information. ${balanceInfo}\n\nYour Hedera account ID is: ${accountId}`,
        timestamp: new Date().toLocaleTimeString(),
        agentName: 'Hedera Agent',
        collaborationType: 'response'
      });
    } catch (error: any) {
      console.error(`[${this.name}] Error handling balance query:`, error);
      this.sendTaskResult(task.id, {
        error: `Failed to process Hedera balance query: ${error.message}`,
        status: 'failed'
      });
    }
  }
  
  private sendTaskResult(taskId: string, result: any): void {
    console.log(`[${this.name}] Sending task result for task ${taskId}`);
    console.log(`[${this.name}] Result:`, JSON.stringify(result, null, 2));
    
    // Emit the result to the event bus
    this.eventBus.emit('task-result', {
      type: 'task-result',
      taskId,
      result,
      timestamp: Date.now(),
      source: 'hedera-agent'
    });
    
    // Also emit as an agent message for the UI
    this.eventBus.emit('agent-message', {
      type: 'agent-message',
      role: 'assistant',
      content: typeof result.message === 'string' ? result.message : JSON.stringify(result, null, 2),
      timestamp: new Date().toLocaleTimeString(),
      agentName: 'Hedera Agent',
      collaborationType: 'tool-result'
    });
    
    // Send a direct message to ensure it reaches the frontend
    this.eventBus.emit('hedera-response', {
      type: 'hedera-response',
      taskId,
      message: typeof result.message === 'string' ? result.message : JSON.stringify(result, null, 2),
      timestamp: new Date().toLocaleTimeString(),
      role: 'assistant',
      agentName: 'Hedera Agent',
      collaborationType: 'response'
    });
    
    // Update task status in task manager
    this.eventBus.emit('task-update', {
      type: 'task-update',
      taskId,
      status: result.status || 'completed',
      result: result
    });
  }

  // Helper methods to directly access Hedera operations
  
  async createFungibleToken(options: any): Promise<any> {
    return this.hederaKit.createFT(options);
  }
  
  async transferToken(tokenId: string, toAccountId: string, amount: number): Promise<any> {
    // Use dynamic import for TokenId
    const { TokenId } = await import('@hashgraph/sdk');
    return this.hederaKit.transferToken(
      TokenId.fromString(tokenId),
      toAccountId,
      amount
    );
  }
  
  async getHbarBalance(accountId?: string): Promise<number> {
    return this.hederaKit.getHbarBalance(accountId);
  }
  
  async createTopic(topicMemo: string, isSubmitKey: boolean = false): Promise<any> {
    return this.hederaKit.createTopic(topicMemo, isSubmitKey);
  }
  
  async submitTopicMessage(topicId: string, message: string): Promise<any> {
    // Use dynamic import for TopicId
    const { TopicId } = await import('@hashgraph/sdk');
    return this.hederaKit.submitTopicMessage(
      TopicId.fromString(topicId),
      message
    );
  }
} 