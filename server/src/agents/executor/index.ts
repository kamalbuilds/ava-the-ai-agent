import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { getExecutorToolkit } from "./toolkit";
import { openai } from "@ai-sdk/openai";
import { getExecutorSystemPrompt } from "../../system-prompts";
import { saveThought } from "../../memory";
import type { Account } from "viem";

// Task types
type TaskType = 'defi_execution' | 'observation' | 'analysis' | 'unknown';

export class ExecutorAgent extends Agent {
  private account: Account;

  constructor(name: string, eventBus: EventBus, account: Account) {
    super(name, eventBus);
    this.account = account;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for task manager events
    this.eventBus.on('task-manager-executor', async (data) => {
      console.log(`[${this.name}] Received task from task-manager:`, data);
      try {
        await this.handleTaskManagerEvent(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling task:`, error);
        this.eventBus.emit('agent-error', {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private determineTaskType(task: string): TaskType {
    // Keywords that indicate a DeFi execution task
    const defiKeywords = [
      'swap', 'bridge', 'transfer', 'send', 'buy', 'sell',
      'deposit', 'withdraw', 'stake', 'unstake', 'provide liquidity',
      'remove liquidity', 'borrow', 'repay', 'leverage', 'long', 'short'
    ];

    // Keywords that indicate an observation task
    const observationKeywords = [
      'monitor', 'check', 'analyze', 'observe', 'track',
      'get market data', 'get price', 'get balance', 'fetch',
      'retrieve', 'watch', 'review'
    ];

    // Check if task contains DeFi execution keywords
    if (defiKeywords.some(keyword => task.toLowerCase().includes(keyword))) {
      return 'defi_execution';
    }

    // Check if task contains observation keywords
    if (observationKeywords.some(keyword => task.toLowerCase().includes(keyword))) {
      return 'observation';
    }

    // If task contains analysis-related terms
    if (task.toLowerCase().includes('analysis') || task.toLowerCase().includes('report')) {
      return 'analysis';
    }

    return 'unknown';
  }

  async handleEvent(event: string, data: any): Promise<void> {
    try {
      switch (event) {
        case 'task-manager-executor':
          return this.handleTaskManagerEvent(data);
        default:
          console.log(`[${this.name}] Unhandled event: ${event}`);
      }
    } catch (error) {
      console.error(`[${this.name}] Error in handleEvent:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleTaskManagerEvent(data: any): Promise<void> {
    try {
      console.log(`[${this.name}] ========== Starting Task Execution ==========`);
      console.log(`[${this.name}] Processing task:`, data);

      if (!data.taskId || !data.task) {
        throw new Error('Invalid task data: missing taskId or task');
      }

      // Determine task type
      const taskType = this.determineTaskType(data.task);
      console.log(`[${this.name}] Determined task type: ${taskType}`);

      // System event for task start
      this.eventBus.emit('agent-action', {
        agent: this.name,
        action: `Starting execution of task: ${data.taskId} (Type: ${taskType})`
      });

      // Handle task based on type
      switch (taskType) {
        case 'defi_execution': {
          const executorTools = getExecutorToolkit(this.account);
          
          // Process DeFi execution task
          console.log(`[${this.name}] Processing DeFi execution task...`);
          
          const storeResult = await executorTools.getTransactionData.execute({
            tasks: [{
              task: data.task,
              taskId: data.taskId
            }]
          });

          if (!storeResult.success) {
            throw new Error(`Failed to process DeFi task: ${storeResult.error}`);
          }

          // Simulate the transaction
          const simulationResult = await executorTools.simulateTasks.execute({});
          
          if (simulationResult.success) {
            // Emit simulation result
            this.eventBus.emit('agent-message', {
              role: 'assistant',
              content: `DeFi Task Simulation:\n${JSON.stringify(simulationResult.result, null, 2)}`,
              timestamp: new Date().toLocaleTimeString(),
              agentName: this.name,
              collaborationType: 'simulation'
            });

            // Send result back to task manager
            this.eventBus.emit('executor-task-manager', {
              taskId: data.taskId,
              result: simulationResult.result,
              status: 'completed',
              timestamp: new Date().toISOString()
            });
          } else {
            throw new Error(simulationResult.error || 'Simulation failed');
          }
          break;
        }

        case 'observation': {
          // Route observation tasks back to task manager for observer
          console.log(`[${this.name}] Routing observation task to observer...`);
          this.eventBus.emit('executor-task-manager', {
            taskId: data.taskId,
            result: 'Task requires observation. Routing to observer.',
            status: 'routing',
            type: 'observation',
            timestamp: new Date().toISOString()
          });
          break;
        }

        case 'analysis': {
          // Route analysis tasks back to task manager
          console.log(`[${this.name}] Routing analysis task to task manager...`);
          this.eventBus.emit('executor-task-manager', {
            taskId: data.taskId,
            result: 'Task requires analysis. Routing back to task manager.',
            status: 'routing',
            type: 'analysis',
            timestamp: new Date().toISOString()
          });
          break;
        }

        default: {
          // For unknown task types, route back to task manager for clarification
          console.log(`[${this.name}] Unknown task type. Routing back to task manager...`);
          this.eventBus.emit('executor-task-manager', {
            taskId: data.taskId,
            result: 'Task type unclear. Please clarify the required action.',
            status: 'routing',
            type: 'unknown',
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.error(`[${this.name}] Error in handleTaskManagerEvent:`, error);
      
      // Send error back to task manager
      this.eventBus.emit('executor-task-manager', {
        taskId: data.taskId,
        result: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
        timestamp: new Date().toISOString()
      });

      // System event for task failure
      this.eventBus.emit('agent-action', {
        agent: this.name,
        action: `Failed to execute task: ${data.taskId}`
      });

      // Emit error message
      this.eventBus.emit('agent-message', {
        role: 'assistant',
        content: `Failed to execute task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString(),
        agentName: this.name,
        collaborationType: 'error'
      });
    }
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    console.log(
      `[executor] step finished. tools called: ${toolCalls.length > 0
        ? toolCalls.map((tool: any) => tool.toolName).join(", ")
        : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "executor",
        text,
        toolCalls,
        toolResults,
      });
    }
  }
}
