import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { getExecutorToolkit } from "./toolkit";
import { openai } from "@ai-sdk/openai";
import { getExecutorSystemPrompt } from "../../system-prompts";
import { saveThought } from "../../memory";
import type { Account } from "viem";

export class ExecutorAgent extends Agent {
  private account: Account;

  constructor(name: string, eventBus: EventBus, account: Account) {
    super(name, eventBus);
    this.account = account;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for task manager events
    this.eventBus.on(`task-manager-${this.name}`, async (data) => {
      console.log(`[${this.name}] Received task from task-manager:`, data);
      try {
        await this.handleTaskManagerEvent(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling task-manager event:`, error);
        this.eventBus.emit('agent-error', {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  async handleEvent(event: string, data: any): Promise<void> {
    switch (event) {
      case `task-manager-${this.name}`:
        return this.handleTaskManagerEvent(data);
    }
  }

  private async handleTaskManagerEvent(data: any): Promise<void> {
    try {
      console.log(`[${this.name}] ========== Starting Task Execution ==========`);
      console.log(`[${this.name}] Received task from task-manager: ${data.result}`);

      const executorTools = getExecutorToolkit(this.account);
      
      // First simulate the tasks
      console.log(`[${this.name}] Simulating tasks...`);
      const simulationResult = await executorTools.simulateTasks.execute({}, {
        toolCallId: `simulation-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      console.log(`[${this.name}] Simulation result:`, simulationResult);
      
      if (simulationResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Task Simulation:\n${simulationResult.result}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'simulation'
        });
      } else {
        console.error(`[${this.name}] Simulation failed:`, simulationResult.error);
        throw new Error(simulationResult.error);
      }

      // Then get transaction data
      console.log(`[${this.name}] Getting transaction data...`);
      const transactionResult = await executorTools.getTransactionData.execute({
        tasks: [{
          task: data.result,
          taskId: data.taskId
        }]
      }, {
        toolCallId: `transaction-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      console.log(`[${this.name}] Transaction data:`, transactionResult);
      
      if (transactionResult.success && transactionResult.result) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Transaction Data:\n${JSON.stringify(transactionResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'transaction'
        });

        // Finally execute the transaction
        if (transactionResult.result.length > 0) {
          console.log(`[${this.name}] Executing transaction...`);
          const executionResult = await executorTools.executeTransaction.execute({
            task: data.result,
            taskId: transactionResult.result[0].taskId
          }, {
            toolCallId: `execution-${data.taskId}`,
            messages: [],
            severity: 'info'
          });
          console.log(`[${this.name}] Execution result:`, executionResult);
          
          if (executionResult.success) {
            this.eventBus.emit('agent-message', {
              role: 'assistant',
              content: executionResult.result,
              timestamp: new Date().toLocaleTimeString(),
              agentName: this.name,
              collaborationType: 'execution'
            });
          } else {
            console.error(`[${this.name}] Execution failed:`, executionResult.error);
            throw new Error(executionResult.error);
          }
        }
      } else {
        console.error(`[${this.name}] Transaction data failed:`, transactionResult.error);
        throw new Error(transactionResult.error);
      }

      console.log(`[${this.name}] ========== Task Execution Complete ==========`);

      // Send final result back to task manager
      this.eventBus.emit(`${this.name}-task-manager`, {
        result: 'Task execution completed successfully',
        report: data.report,
        status: 'completed'
      });

    } catch (error) {
      console.error(`[${this.name}] Error in handleTaskManagerEvent:`, error);
      this.eventBus.emit(`${this.name}-task-manager`, {
        result: `Error executing task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        report: data.report,
        status: 'failed'
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
