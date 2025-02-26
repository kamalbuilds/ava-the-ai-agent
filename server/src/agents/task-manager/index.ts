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
import { RecallStorage } from "../plugins/recall-storage/index.js";
import { ATCPIPProvider } from "../plugins/atcp-ip";
import type { IPLicenseTerms, IPMetadata } from "../types/ip-agent";

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  result?: any;
  error?: string;
  toolResults?: any[];
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
      console.log(`[${this.name}] ========== RECEIVED EXECUTOR EVENT ==========`);
      console.log(`[${this.name}] Event: executor-task-manager`);
      console.log(`[${this.name}] Task ID: ${data.taskId}`);
      console.log(`[${this.name}] Status: ${data.status}`);
      console.log(`[${this.name}] Timestamp: ${new Date().toISOString()}`);
      
      try {
        await this.handleExecutorResult(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling executor result:`, error);
      }
    });

    // Listen for observer results
    this.eventBus.on('observer-task-manager', async (data) => {
      console.log(`[${this.name}] ========== RECEIVED OBSERVER EVENT ==========`);
      console.log(`[${this.name}] Event: observer-task-manager`);
      console.log(`[${this.name}] Task ID: ${data.taskId}`);
      console.log(`[${this.name}] Status: ${data.status}`);
      console.log(`[${this.name}] Timestamp: ${new Date().toISOString()}`);
      
      try {
        await this.handleObserverResult(data);
      } catch (error) {
        console.error(`[${this.name}] Error handling observer result:`, error);
      }
    });

    // Listen for task updates
    this.eventBus.on('task-update', async (data) => {
      console.log(`[${this.name}] ========== TASK UPDATE ==========`);
      console.log(`[${this.name}] Task ID: ${data.taskId}`);
      console.log(`[${this.name}] Status: ${data.status}`);
      console.log(`[${this.name}] Source: ${data.source}`);
      console.log(`[${this.name}] Destination: ${data.destination}`);
      console.log(`[${this.name}] Timestamp: ${new Date().toISOString()}`);
    });
  }

  private async handleExecutorResult(data: any): Promise<void> {
    console.log(`[${this.name}] ========== Handling Executor Result ==========`);
    console.log(`[${this.name}] Received result from executor for task: ${data.taskId}`);
    console.log(`[${this.name}] Result status: ${data.status}`);
    
    try {
      let task = this.tasks.get(data.taskId);
      
      if (!task) {
        console.warn(`[${this.name}] Task ${data.taskId} not found in memory, attempting recovery`);
        try {
          const storedTask = await this.recallStorage.retrieve(`task:${data.taskId}`);
          if (storedTask.data) {
            task = storedTask.data as Task;
            this.tasks.set(data.taskId, task);
            console.log(`[${this.name}] Successfully recovered task ${data.taskId} from storage`);
          } else {
            throw new Error('Task not found in storage');
          }
        } catch (error) {
          console.error(`[${this.name}] Failed to recover task ${data.taskId}:`, error);
          // Create a new task if recovery fails
          task = {
            id: data.taskId,
            description: data.task || 'Unknown task',
            status: 'pending',
            timestamp: new Date().toISOString()
          };
          this.tasks.set(data.taskId, task);
          console.log(`[${this.name}] Created new task ${data.taskId} for untracked result`);
        }
      }

      // Store result in Recall with detailed logging
      console.log(`[${this.name}] Storing execution result in Recall for task: ${data.taskId}`);
      await this.storeIntelligence(`execution:${data.taskId}`, {
        result: data.result,
        status: data.status,
        toolResults: data.toolResults,
        error: data.error,
        timestamp: Date.now()
      });
      console.log(`[${this.name}] Successfully stored execution result`);

      // Update task status with logging
      console.log(`[${this.name}] Updating task status to: ${data.status}`);
      task.status = data.status;
      task.result = data.result;
      task.error = data.error;
      task.toolResults = data.toolResults;
      this.tasks.set(data.taskId, task);

      // Store task update in Recall
      console.log(`[${this.name}] Storing updated task in Recall`);
      await this.storeIntelligence(`task:${data.taskId}`, {
        ...task,
        timestamp: Date.now()
      });

      // Emit task update with detailed event
      console.log(`[${this.name}] Emitting task update event`);
      this.eventBus.emit('task-update', {
        taskId: data.taskId,
        status: data.status,
        result: data.result,
        error: data.error,
        toolResults: data.toolResults,
        timestamp: Date.now(),
        source: 'executor',
        destination: 'task-manager'
      });

      console.log(`[${this.name}] ========== Executor Result Handling Complete ==========\n`);

    } catch (error) {
      console.error(`[${this.name}] Error handling executor result:`, error);
      this.eventBus.emit('task-update', {
        taskId: data.taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        source: 'executor',
        destination: 'task-manager'
      });
    }
  }

  private async handleObserverResult(data: any): Promise<void> {
    console.log(`[${this.name}] ========== Handling Observer Result ==========`);
    console.log(`[${this.name}] Received result from observer for task: ${data.taskId}`);
    console.log(`[${this.name}] Result status: ${data.status}`);
    
    try {
      let task = this.tasks.get(data.taskId);
      
      if (!task) {
        console.warn(`[${this.name}] Task ${data.taskId} not found in memory, attempting recovery`);
        try {
          const storedTask = await this.recallStorage.retrieve(`task:${data.taskId}`);
          if (storedTask.data) {
            task = storedTask.data as Task;
            this.tasks.set(data.taskId, task);
            console.log(`[${this.name}] Successfully recovered task ${data.taskId} from storage`);
          } else {
            throw new Error('Task not found in storage');
          }
        } catch (error) {
          console.error(`[${this.name}] Failed to recover task ${data.taskId}:`, error);
          return;
        }
      }

      // Store result in Recall with detailed logging
      console.log(`[${this.name}] Storing observation result in Recall for task: ${data.taskId}`);
      await this.storeIntelligence(`observation:${data.taskId}`, {
        result: data.result,
        status: data.status,
        toolResults: data.toolResults,
        error: data.error,
        timestamp: Date.now()
      });
      console.log(`[${this.name}] Successfully stored observation result`);

      // Update task status with logging
      console.log(`[${this.name}] Updating task status to: ${data.status}`);
      task.status = data.status;
      task.result = data.result;
      task.error = data.error;
      task.toolResults = data.toolResults;
      this.tasks.set(data.taskId, task);

      // Store task update in Recall with logging
      console.log(`[${this.name}] Storing updated task in Recall`);
      await this.storeIntelligence(`task:${data.taskId}`, {
        ...task,
        timestamp: Date.now()
      });

      // Emit task update with detailed event
      console.log(`[${this.name}] Emitting task update event`);
      this.eventBus.emit('task-update', {
        taskId: data.taskId,
        status: data.status,
        result: data.result,
        error: data.error,
        toolResults: data.toolResults,
        timestamp: Date.now(),
        source: 'observer',
        destination: 'task-manager'
      });

      console.log(`[${this.name}] ========== Observer Result Handling Complete ==========\n`);

    } catch (error) {
      console.error(`[${this.name}] Error handling observer result:`, error);
      this.eventBus.emit('task-update', {
        taskId: data.taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        source: 'observer',
        destination: 'task-manager'
      });
    }
  }

  async createTask(description: string): Promise<string> {
    const taskId = uuidv4();  // Use UUID for consistent task IDs
    console.log(`[${this.name}] Creating new task with ID: ${taskId} and description: ${description}`);
    
    const task: Task = {
      id: taskId,
      description,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      // Store task in memory first
      this.tasks.set(taskId, task);
      console.log(`[${this.name}] Task ${taskId} stored in memory`);

      // Then store in Recall
      await this.storeIntelligence(`task:${taskId}`, {
        ...task,
        timestamp: Date.now()
      });
      console.log(`[${this.name}] Task ${taskId} stored in Recall`);

      return taskId;
    } catch (error) {
      console.error(`[${this.name}] Error creating task ${taskId}:`, error);
      // Clean up memory if storage fails
      this.tasks.delete(taskId);
      throw error;
    }
  }

  async assignTask(taskId: string, agentType: 'executor' | 'observer'): Promise<void> {
    console.log(`[${this.name}] ========== ASSIGNING TASK ==========`);
    console.log(`[${this.name}] Task ID: ${taskId}`);
    console.log(`[${this.name}] Assigning to: ${agentType}`);
    console.log(`[${this.name}] Timestamp: ${new Date().toISOString()}`);
    
    try {
      let task = this.tasks.get(taskId);
      
      if (!task) {
        console.warn(`[${this.name}] Task ${taskId} not found in memory, attempting recovery`);
        try {
          const storedTask = await this.recallStorage.retrieve(`task:${taskId}`);
          if (storedTask.data) {
            task = storedTask.data as Task;
            this.tasks.set(taskId, task);
            console.log(`[${this.name}] Recovered task ${taskId} from storage`);
          } else {
            throw new Error(`No task found with ID: ${taskId}`);
          }
        } catch (error) {
          console.error(`[${this.name}] Failed to recover task ${taskId}:`, error);
          throw new Error(`No task found with ID: ${taskId}`);
        }
      }

      task.assignedTo = agentType;
      task.status = 'in_progress';
      this.tasks.set(taskId, task);

      // Store task assignment in Recall
      await this.storeIntelligence(`assignment:${taskId}`, {
        taskId,
        assignedTo: agentType,
        status: 'in_progress',
        timestamp: Date.now()
      });

      // Store updated task in Recall
      await this.storeIntelligence(`task:${taskId}`, {
        ...task,
        timestamp: Date.now()
      });

      // Emit task to appropriate agent with enhanced logging
      console.log(`[${this.name}] ========== EMITTING TASK TO ${agentType.toUpperCase()} ==========`);
      this.eventBus.emit(`task-manager-${agentType}`, {
        taskId,
        task: task.description,
        type: agentType === 'observer' ? 'analyze' : 'execute',
        timestamp: Date.now(),
        source: 'task-manager',
        destination: agentType
      });
      console.log(`[${this.name}] Task ${taskId} emitted to ${agentType}`);

    } catch (error) {
      console.error(`[${this.name}] Error assigning task:`, error);
      this.eventBus.emit('task-update', {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'task-manager',
        destination: 'system'
      });
      throw error;
    }
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
