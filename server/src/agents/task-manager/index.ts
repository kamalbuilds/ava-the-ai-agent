import { generateText } from "ai";
import type { EventBus } from "../../comms";
import {
  getTaskManagerFinalReportSystemPrompt,
  getTaskManagerSystemPrompt,
} from "../../system-prompts";
import { IPAgent } from "../types/ip-agent";
import { openai } from "@ai-sdk/openai";
import { getTaskManagerToolkit } from "./toolkit";
import { saveThought, storeReport } from "../../memory";
import env from "../../env";
import { v4 as uuidv4 } from 'uuid';
import type { AIProvider, Tool } from "../../services/ai/types";
import type { Account } from "viem";
import { RecallStorage } from "../plugins/recall-storage";
import { ATCPIPProvider } from "../plugins/atcp-ip";
import type { IPLicenseTerms, IPMetadata } from "../types/ip-agent";

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  result?: any;
  licenseId?: string;
  timestamp: string;
}

/**
 * @dev The task manager agent is responsible for generating tasks to be executed.
 */
export class TaskManagerAgent extends IPAgent {
  private tasks: Map<string, Task> = new Map();
  private tools: Record<string, Tool>;
  private account: Account;

  /**
   * @param name - The name of the agent
   * @param eventBus - The event bus to emit events to other agents
   * @param account - The account associated with the agent
   * @param recallStorage - The recall storage plugin
   * @param atcpipProvider - The ATCPIP provider plugin
   */
  constructor(
    name: string,
    eventBus: EventBus,
    account: Account,
    recallStorage: RecallStorage,
    atcpipProvider: ATCPIPProvider
  ) {
    super(name, eventBus, recallStorage, atcpipProvider);
    this.account = account;
    this.tools = getTaskManagerToolkit(eventBus);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for executor results
    this.eventBus.on('executor-task-manager', async (data) => {
      try {
        await this.handleExecutorResult(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling executor result:`, error);
      }
    });

    // Listen for observer results
    this.eventBus.on('observer-task-manager', async (data) => {
      try {
        await this.handleObserverResult(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling observer result:`, error);
      }
    });
  }

  private async handleExecutorResult(data: any): Promise<void> {
    const task = this.tasks.get(data.taskId);
    if (!task) {
      console.error(`[${this.name}] No task found with ID: ${data.taskId}`);
      return;
    }

    // Store execution result as IP
    const executionLicenseTerms: IPLicenseTerms = {
      name: `Task Execution Result - ${data.taskId}`,
      description: `Execution results for task ${data.taskId}`,
      scope: 'commercial',
      transferability: true,
      onchain_enforcement: true,
      royalty_rate: 0.05
    };

    const licenseId = await this.mintLicense(executionLicenseTerms, {
      issuer_id: this.name,
      holder_id: 'executor',
      issue_date: Date.now(),
      version: '1.0'
    });

    // Store result with license
    await this.storeIntelligence(`execution:${data.taskId}`, {
      result: data.result,
      status: data.status,
      licenseId,
      timestamp: Date.now()
    });

    // Update task status
    task.status = data.status;
    task.result = data.result;
    task.licenseId = licenseId;
    this.tasks.set(data.taskId, task);

    // Store task update in Recall
    await this.storeIntelligence(`task:${data.taskId}`, {
      ...task,
      timestamp: Date.now()
    });

    // Emit task update
    this.eventBus.emit('task-update', {
      taskId: data.taskId,
      status: data.status,
      result: data.result,
      licenseId
    });
  }

  private async handleObserverResult(data: any): Promise<void> {
    const task = this.tasks.get(data.taskId);
    if (!task) {
      console.error(`[${this.name}] No task found with ID: ${data.taskId}`);
      return;
    }

    // Store observation result as IP
    const observationLicenseTerms: IPLicenseTerms = {
      name: `Task Observation Result - ${data.taskId}`,
      description: `Observation results for task ${data.taskId}`,
      scope: 'commercial',
      transferability: true,
      onchain_enforcement: true,
      royalty_rate: 0.05
    };

    const licenseId = await this.mintLicense(observationLicenseTerms, {
      issuer_id: this.name,
      holder_id: 'observer',
      issue_date: Date.now(),
      version: '1.0'
    });

    // Store result with license
    await this.storeIntelligence(`observation:${data.taskId}`, {
      result: data.result,
      status: data.status,
      licenseId,
      timestamp: Date.now()
    });

    // Update task status
    task.status = data.status;
    task.result = data.result;
    task.licenseId = licenseId;
    this.tasks.set(data.taskId, task);

    // Store task update in Recall
    await this.storeIntelligence(`task:${data.taskId}`, {
      ...task,
      timestamp: Date.now()
    });

    // Emit task update
    this.eventBus.emit('task-update', {
      taskId: data.taskId,
      status: data.status,
      result: data.result,
      licenseId
    });
  }

  async createTask(description: string): Promise<string> {
    const taskId = `task-${Date.now()}`;
    const task: Task = {
      id: taskId,
      description,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    // Store task in Recall
    await this.storeIntelligence(`task:${taskId}`, {
      ...task,
      timestamp: Date.now()
    });

    this.tasks.set(taskId, task);
    return taskId;
  }

  async assignTask(taskId: string, agentType: 'executor' | 'observer'): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`No task found with ID: ${taskId}`);
    }

    task.assignedTo = agentType;
    task.status = 'in_progress';
    this.tasks.set(taskId, task);

    // Store task assignment in Recall
    await this.storeIntelligence(`assignment:${taskId}`, {
      taskId,
      assignedTo: agentType,
      timestamp: Date.now()
    });

    // Emit task to appropriate agent
    this.eventBus.emit(`task-manager-${agentType}`, {
      taskId,
      task: task.description
    });
  }

  async onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    if (text) {
      // Store chain of thought in Recall
      await this.storeChainOfThought(`thought:${Date.now()}`, [text], {
        toolCalls: toolCalls || [],
        toolResults: toolResults || []
      });

      await saveThought({
        agent: "task-manager",
        text,
        toolCalls: toolCalls || [],
        toolResults: toolResults || []
      });
    }
  }

  private async processAnalysis(taskData: Task): Promise<string> {
    try {
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized');
      }

      console.log(`[${this.name}] ========== Starting Analysis Processing ==========`);
      console.log(`[${this.name}] Processing analysis for task: ${taskData.id}`);

      // Check if this is a SUI-related task
      const isSuiTask = taskData.description.toLowerCase().includes('sui');
      
      if (isSuiTask) {
        console.log(`[${this.name}] Detected SUI-related task, forwarding to SUI agent...`);
        
        // Execute SUI agent tool
        const suiResult = await this.tools.sendMessageToSuiAgent.execute({
          message: taskData.description,
          taskId: taskData.id
        }, {
          toolCallId: `sui-${taskData.id}`,
          messages: [],
          severity: 'info'
        });

        // Update task status
        taskData.status = 'completed';
        taskData.result = suiResult;
        this.tasks.set(taskData.id, taskData);

        // Save the thought
        await saveThought({
          agent: this.name,
          text: `Forwarded SUI task to SUI agent: ${taskData.description}`,
          toolCalls: [],
          toolResults: [suiResult]
        });

        return `Task has been forwarded to the SUI agent for execution: ${taskData.description}`;
      }

      // Execute tools from toolkit for non-SUI tasks
      console.log(`[${this.name}] ========== Starting Tool Execution for non SUI tasks==========`);
      const toolResults = [];

      // Send message to observer
      console.log(`[${this.name}] Executing sendMessageToObserver tool...`);
      const observerResult = await this.tools.sendMessageToObserver.execute({
        message: taskData.description,
        taskId: taskData.id
      }, {
        toolCallId: `observer-${taskData.id}`,
        messages: [],
        severity: 'info'
      });
      toolResults.push({
        tool: 'sendMessageToObserver',
        result: observerResult
      });

      if (observerResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Observer Analysis Request:\n${JSON.stringify(observerResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'tool-result'
        });
      }

      // Send message to executor if action needed
      if (taskData.status === 'in_progress') {
        console.log(`[${this.name}] Executing sendMessageToExecutor tool...`);
        const executorResult = await this.tools.sendMessageToExecutor.execute({
          message: taskData.description,
          taskId: taskData.id
        }, {
          toolCallId: `executor-${taskData.id}`,
          messages: [],
          severity: 'info'
        });
        toolResults.push({
          tool: 'sendMessageToExecutor',
          result: executorResult
        });

        if (executorResult.success) {
          this.eventBus.emit('agent-message', {
            role: 'assistant',
            content: `Executor Task Request:\n${JSON.stringify(executorResult.result, null, 2)}`,
            timestamp: new Date().toLocaleTimeString(),
            agentName: this.name,
            collaborationType: 'tool-result'
          });
        }
      }

      console.log(`[${this.name}] ========== Tool Execution Complete ==========`);
      console.log(`[${this.name}] Tool Results:`, JSON.stringify(toolResults, null, 2));

      // Generate final analysis using AI
      console.log(`[${this.name}] Generating final analysis...`);
      const response = await this.aiProvider.generateText(
        `Process this task and tool results to generate specific executable actions:\nTask: ${taskData.description}\nTool Results: ${JSON.stringify(toolResults, null, 2)}`,
        this.getSystemPrompt()
      );

      // Update task status
      taskData.status = 'completed';
      taskData.result = response.text;
      this.tasks.set(taskData.id, taskData);

      // Save the thought
      await saveThought({
        agent: this.name,
        text: response.text,
        toolCalls: response.toolCalls || [],
        toolResults
      });

      return response.text;

    } catch (error) {
      taskData.status = 'failed';
      this.tasks.set(taskData.id, taskData);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are a task manager agent responsible for:
1. Analyzing tasks from the observer agent
2. Detecting and routing SUI blockchain tasks to the SUI agent
3. Breaking down complex tasks into executable steps
4. Coordinating with the executor agent
5. Maintaining task state and progress
6. Handling errors and retries

For any tasks related to SUI blockchain operations, make sure to route them to the SUI agent.
Please process the given task and provide clear, executable instructions.`;
  }

  updateAIProvider(newProvider: AIProvider): void {
    if (this.aiProvider) {
      this.aiProvider = newProvider;
      this.eventBus.emit("agent-action", {
        agent: this.name,
        action: "Updated AI provider"
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

  async handleEvent(event: string, data: any): Promise<void> {
    try {
      switch (event) {
        case 'executor-task-manager':
          await this.handleExecutorResult(data);
          break;
        case 'observer-task-manager':
          await this.handleObserverResult(data);
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
}
