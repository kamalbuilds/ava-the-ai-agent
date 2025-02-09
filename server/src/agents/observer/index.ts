import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { openai } from "@ai-sdk/openai";
import { getObserverSystemPrompt } from "../../system-prompts";
import type { Hex, Account } from "viem";
import { getObserverToolkit } from "./toolkit";
import { saveThought } from "../../memory";
import env from "../../env";
import type { AIProvider, AIResponse, Tool } from "../../services/ai/types";

const OBSERVER_STARTING_PROMPT = `Analyze the current market situation using Cookie API data. 
Focus on:
1. Top agents by mindshare
2. Recent relevant tweets and social sentiment
3. Specific agent performance metrics
Use this information to identify potential opportunities and risks.`;
const oldprompt = "Based on the current market data and the tokens that you hold, generate a report explaining what steps could be taken.";

/**
 * @dev The observer agent is responsible for generating a report about the best opportunities to make money.
 */
export class ObserverAgent extends Agent {
  private address: Hex;
  private account: Account;
  private isRunning: boolean = false;
  private aiProvider: AIProvider;
  private tools: Record<string, Tool>;

  /**
   * @param name - The name of the agent
   * @param eventBus - The event bus to emit events to other agents
   * @param account - The account to observe
   * @param aiProvider - The AI provider to use for generating text
   */
  constructor(
    name: string,
    eventBus: EventBus,
    account: Account,
    aiProvider: AIProvider
  ) {
    super(name, eventBus);
    this.account = account;
    this.address = account.address;
    this.aiProvider = aiProvider;
    this.tools = getObserverToolkit(this.address);
  }

  /**
   * Implementation of abstract method from Agent class
   */
  async onStepFinish({ text, toolCalls, toolResults }: {
    text?: string;
    toolCalls?: any[];
    toolResults?: any[];
  }): Promise<void> {
    console.log(
        // @ts-ignore
      `[observer] step finished. tools called: ${toolCalls?.length > 0
        // @ts-ignore
        ? toolCalls.map((tool: any) => tool.toolName).join(", ")
        : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "observer",
        text,
        toolCalls: toolCalls || [],
        toolResults: toolResults || [],
      });
    }
  }

  /**
   * @param event - The event to handle
   * @param data - The data to handle
   */
  async handleEvent(event: string, data: any): Promise<void> {
    try {
      switch (event) {
        case `task-manager-${this.name}`:
          await this.handleTaskManagerEvent(data);
          break;
        case 'market-update':
          await this.handleMarketUpdate(data);
          break;
        case 'sentiment-update':
          await this.handleSentimentUpdate(data);
          break;
        default:
          console.log(`[${this.name}] Unhandled event: ${event}`);
      }
    } catch (error) {
      console.error(`[${this.name}] Error handling event:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @param data - The data to handle
   */
  private async handleTaskManagerEvent(data: any): Promise<void> {
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Processing task manager request'
    });

    if (data?.result) {
      console.log(`[${this.name}] Processing task manager result: ${data.result}`);
    }

    await this.start(data);
  }

  private async handleMarketUpdate(data: any): Promise<void> {
    // Handle market updates
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Processing market update'
    });
  }

  private async handleSentimentUpdate(data: any): Promise<void> {
    // Handle sentiment updates
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Processing sentiment update'
    });
  }

  /**
   * @dev Starts the observer agent
   * @param taskManagerData - The data from the task manager agent
   */
  async start(taskManagerData?: any): Promise<void> {
    if (!this.address) {
      throw new Error("Observer agent not initialized with account address");
    }

    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Starting market analysis'
    });

    try {
      const systemPrompt = getObserverSystemPrompt(this.address);
      const response = await this.aiProvider.generateText(
        taskManagerData ? 
          `Analyze the following task manager data and provide recommendations:\n${JSON.stringify(taskManagerData)}` :
          'Perform a complete market and portfolio analysis.',
        systemPrompt.content
      );

      // Process tool calls if any
      if (response.toolCalls) {
        for (const toolCall of response.toolCalls) {
          try {
            const result = await this.executeTool(toolCall);
            this.eventBus.emit('agent-action', {
              agent: this.name,
              action: `Tool ${toolCall.name} executed successfully`
            });
          } catch (error) {
            console.error(`[${this.name}] Tool execution error:`, error);
          }
        }
      }

      // Emit results to task manager
      this.eventBus.emit(`${this.name}-task-manager`, {
        report: response.text,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`[${this.name}] Error in start:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executeTool(toolCall: { name: string; args: any }): Promise<any> {
    const tool = this.tools[toolCall.name];
    if (!tool) {
      throw new Error(`Tool ${toolCall.name} not found`);
    }
    return tool.execute(toolCall.args);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Stopping observation'
    });
  }

  async processTask(task: string): Promise<void> {
    try {
      const systemPrompt = getObserverSystemPrompt(this.address!);
      const response = await this.aiProvider.generateText(task, systemPrompt.content);
      
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const tool = this.tools[toolCall.name];
          if (!tool) {
            throw new Error(`Tool ${toolCall.name} not found`);
          }
          
          const result = await tool.execute(toolCall.args);
          
          if (!result.success) {
            this.eventBus.emit('agent-error', {
              agent: this.name,
              error: `Tool ${toolCall.name} failed: ${result.result}`
            });
            continue;
          }

          this.eventBus.emit('agent-response', {
            agent: this.name,
            message: `Tool ${toolCall.name} executed successfully`,
            result: result.result
          });
        }
      }

      // Continue with task processing
      this.eventBus.emit('observer-task-manager', {
        type: 'task-result',
        result: response.text
      });
    } catch (error) {
      console.error('[Observer] Error processing task:', error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: 'Failed to process task'
      });
    }
  }

  private async analyzeTask(task: string): Promise<string> {
    // Implement task analysis logic
    // This should use your existing AI tools to analyze the task
    // and determine the best course of action
    return "Task analysis result";
  }

  async processMessage(message: string): Promise<string> {
    try {
      const systemPrompt = getObserverSystemPrompt(this.address!);
      const response = await this.aiProvider.generateText(
        message,
        systemPrompt.content
      );

      await saveThought({
        agent: this.name,
        text: response.text,
        toolCalls: response.toolCalls || [],
        toolResults: []
      });

      return response.text;
    } catch (error) {
      console.error('Observer agent error:', error);
      throw error;
    }
  }

  updateAIProvider(newProvider: AIProvider): void {
    this.aiProvider = newProvider;
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Updated AI provider'
    });
  }
}
