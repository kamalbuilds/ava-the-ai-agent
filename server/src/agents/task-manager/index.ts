import { generateText } from "ai";
import type { EventBus } from "../../comms";
import {
  getTaskManagerFinalReportSystemPrompt,
  getTaskManagerSystemPrompt,
} from "../../system-prompts";
import { Agent } from "../agent";
import { openai } from "@ai-sdk/openai";
import { getTaskManagerToolkit } from "./toolkit";
import { saveThought, storeReport } from "../../memory";
import env from "../../env";
import { v4 as uuidv4 } from 'uuid';
import type { AIProvider, Tool } from "../../services/ai/types";

interface TaskData {
  taskId: string;
  task: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'processed' | 'completed' | 'failed';
  type?: 'action' | 'no-op';
}

/**
 * @dev The task manager agent is responsible for generating tasks to be executed.
 */
export class TaskManagerAgent extends Agent {
  private tasks: Map<string, TaskData>;
  private tools: Record<string, Tool>;

  /**
   * @param eventBus - The event bus to emit events to other agents
   */
  constructor(eventBus: EventBus, aiProvider: AIProvider) {
    super("task-manager", eventBus, aiProvider);
    this.tasks = new Map();
    this.tools = getTaskManagerToolkit(eventBus);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle observer events
    this.eventBus.on('observer-task-manager', async (data) => {
      console.log(`[${this.name}] Received observer response:`, data);
      try {
        await this.handleEvent('observer-task-manager', data);
      } catch (error) {
        console.error(`[${this.name}] Error handling observer response:`, error);
        this.eventBus.emit('agent-error', {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle executor events
    this.eventBus.on(`executor-${this.name}`, async (data) => {
      await this.handleExecutorResult(data);
    });
  }

  /**
   * @param event - The event to handle
   * @param data - The data to handle
   */
  async handleEvent(event: string, data: any): Promise<void> {
    try {
      console.log(`[${this.name}] Handling event: ${event} with data:`, data);
      
      switch (event) {
        case 'observer-task-manager':
          if (data.type === 'analysis') {
            console.log(`[${this.name}] Processing observer analysis for task: ${data.taskId}`);
            
            const taskId = data.taskId;
            let task = this.tasks.get(taskId);
            
            if (!task) {
              // Create task if it doesn't exist
              task = {
                taskId,
                task: data.result,
                timestamp: new Date().toISOString(),
                status: 'pending',
                type: 'action'
              };
              this.tasks.set(taskId, task);
              console.log(`[${this.name}] Created missing task: ${taskId}`);

              // System event for task creation
              this.eventBus.emit('agent-action', {
                agent: this.name,
                action: `Created task: ${taskId}`
              });
            }

            // Handle partial data case
            if (data.status === 'partial' || data.partialData) {
              console.log(`[${this.name}] Received partial data for task: ${taskId}`);
              
              // Update task status
              task.status = 'processing';
              this.tasks.set(taskId, task);

              // Emit status message
              this.eventBus.emit('agent-message', {
                role: 'assistant',
                content: `Received partial data. Some tools failed but continuing with available information.`,
                timestamp: new Date().toLocaleTimeString(),
                agentName: this.name,
                collaborationType: 'status'
              });
            }

            // Process the analysis regardless of partial data
            console.log(`[${this.name}] Processing analysis to generate actions`);
            const processedTask = await this.processAnalysis(task);

            // System event for analysis processing
            this.eventBus.emit('agent-action', {
              agent: this.name,
              action: `Processed analysis for task: ${taskId}`
            });

            // Chat message for processed task
            this.eventBus.emit('agent-message', {
              role: 'assistant',
              content: processedTask,
              timestamp: new Date().toLocaleTimeString(),
              agentName: this.name,
              collaborationType: 'decision'
            });

            // Forward to executor if action needed
            if (task.type === 'action') {
              console.log(`[${this.name}] Forwarding task to executor: ${taskId}`);
              
              // System event for executor forwarding
              this.eventBus.emit('agent-action', {
                agent: this.name,
                action: `Forwarding task to executor: ${taskId}`
              });

              // Chat message for executor handoff
              this.eventBus.emit('agent-message', {
                role: 'assistant',
                content: `I'm forwarding the analyzed task to the executor for implementation.`,
                timestamp: new Date().toLocaleTimeString(),
                agentName: this.name,
                collaborationType: 'handoff'
              });

              // Update task status
              task.status = 'processing';
              this.tasks.set(taskId, task);

              // Forward to executor with proper format
              this.eventBus.emit('task-manager-executor', {
                taskId,
                task: processedTask,
                type: 'execute',
                timestamp: new Date().toISOString(),
                partialData: data.partialData || data.status === 'partial'
              });
            }
          }
          break;

        case `executor-${this.name}`:
          console.log(`[${this.name}] Received executor result`);
          await this.handleExecutorResult(data);
          break;

        default:
          console.log(`[${this.name}] Unhandled event: ${event}`);
      }
    } catch (error: unknown) {
      console.error(`[${this.name}] Error handling event:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Try to continue processing even if there's an error
      if (data?.taskId) {
        const task = this.tasks.get(data.taskId);
        if (task) {
          task.status = 'processing';
          this.tasks.set(data.taskId, task);
          
          // Request a retry from observer
          this.eventBus.emit('task-manager-observer', {
            taskId: data.taskId,
            task: task.task,
            type: 'analyze',
            isRetry: true
          });
        }
      }
    }
  }

  /**
   * @dev Handles the observer report
   * @param data - The data to handle
   */
  private async handleObserverReport(data: {
    type: string;
    result: string;
    timestamp: string;
  }): Promise<void> {
    try {
      console.log(`[${this.name}] Processing observer report`);
      
      const taskId = uuidv4();
      const taskData: TaskData = {
        taskId,
        task: data.result,
        timestamp: data.timestamp,
        status: 'pending',
        type: 'action'
      };

      // Store task
      this.tasks.set(taskId, taskData);
      console.log(`[${this.name}] Created new task: ${taskId}`);

      // System event for task creation
      this.eventBus.emit('agent-action', {
        agent: this.name,
        action: `Created task: ${taskId}`
      });

      // Chat message for task creation
      this.eventBus.emit('agent-message', {
        role: 'assistant',
        content: `I've created a new task to analyze and process your request.`,
        timestamp: new Date().toLocaleTimeString(),
        agentName: this.name,
        collaborationType: 'task-creation'
      });

      // Request observer analysis
      console.log(`[${this.name}] Requesting observer analysis`);
      this.eventBus.emit('task-manager-observer', {
        taskId,
        task: data.result,
        type: 'analyze'
      });

      // Update task status
      taskData.status = 'processing';
      this.tasks.set(taskId, taskData);

    } catch (error) {
      console.error(`[${this.name}] Error handling observer report:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async processTask(task: string): Promise<void> {
    try {
      console.log(`[${this.name}] Starting new task processing`);
      
      const taskId = uuidv4();
      const taskData: TaskData = {
        taskId,
        task,
        timestamp: new Date().toISOString(),
        status: 'pending',
        type: 'action'
      };

      // Store task
      this.tasks.set(taskId, taskData);
      console.log(`[${this.name}] Created new task: ${taskId}`);

      // System event for task creation
      this.eventBus.emit('agent-action', {
        agent: this.name,
        action: `Created task: ${taskId}`
      });

      // Chat message for task creation
      this.eventBus.emit('agent-message', {
        role: 'assistant',
        content: `I've created a new task to analyze and process your request.`,
        timestamp: new Date().toLocaleTimeString(),
        agentName: this.name,
        collaborationType: 'task-creation'
      });

      // Request observer analysis
      console.log(`[${this.name}] Requesting observer analysis for task: ${taskId}`);
      this.eventBus.emit('task-manager-observer', {
        taskId,
        task,
        type: 'analyze'
      });

      // Update task status
      taskData.status = 'processing';
      this.tasks.set(taskId, taskData);

    } catch (error) {
      console.error(`[${this.name}] Error in processTask:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processAnalysis(taskData: TaskData): Promise<string> {
    try {
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized');
      }

      console.log(`[${this.name}] ========== Starting Analysis Processing ==========`);
      console.log(`[${this.name}] Processing analysis for task: ${taskData.taskId}`);

      // Execute tools from toolkit
      console.log(`[${this.name}] ========== Starting Tool Execution ==========`);
      const toolResults = [];

      // Send message to observer
      console.log(`[${this.name}] Executing sendMessageToObserver tool...`);
      const observerResult = await this.tools.sendMessageToObserver.execute({
        message: taskData.task,
        taskId: taskData.taskId
      }, {
        toolCallId: `observer-${taskData.taskId}`,
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
      if (taskData.type === 'action') {
        console.log(`[${this.name}] Executing sendMessageToExecutor tool...`);
        const executorResult = await this.tools.sendMessageToExecutor.execute({
          message: taskData.task,
          taskId: taskData.taskId
        }, {
          toolCallId: `executor-${taskData.taskId}`,
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
        `Process this task and tool results to generate specific executable actions:\nTask: ${taskData.task}\nTool Results: ${JSON.stringify(toolResults, null, 2)}`,
        this.getSystemPrompt()
      );

      // Update task status
      taskData.status = 'processed';
      this.tasks.set(taskData.taskId, taskData);

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
      this.tasks.set(taskData.taskId, taskData);
      throw error;
    }
  }

  private async handleExecutorResult(data: any): Promise<void> {
    try {
      console.log(`[${this.name}] Processing executor result:`, data);
      const task = this.tasks.get(data.taskId);
      
      if (!task) {
        console.error(`[${this.name}] No task found for ID: ${data.taskId}`);
        return;
      }

      // Handle routing responses from executor
      if (data.status === 'routing') {
        console.log(`[${this.name}] Handling routing request from executor`);
        
        switch (data.type) {
          case 'observation': {
            console.log(`[${this.name}] Routing task to observer for observation`);
            // Update task status
            task.status = 'processing';
            this.tasks.set(data.taskId, task);
            
            // Forward to observer
            this.eventBus.emit('task-manager-observer', {
              taskId: data.taskId,
              task: task.task,
              type: 'analyze'
            });

            // System event for routing
            this.eventBus.emit('agent-action', {
              agent: this.name,
              action: `Routed task ${data.taskId} to observer for analysis`
            });
            break;
          }

          case 'analysis': {
            console.log(`[${this.name}] Processing analysis request`);
            // Update task status
            task.status = 'processing';
            this.tasks.set(data.taskId, task);
            
            // Process the analysis
            const processedTask = await this.processAnalysis(task);
            
            // System event for analysis
            this.eventBus.emit('agent-action', {
              agent: this.name,
              action: `Processed analysis for task ${data.taskId}`
            });

            // Chat message for analysis result
            this.eventBus.emit('agent-message', {
              role: 'assistant',
              content: processedTask,
              timestamp: new Date().toLocaleTimeString(),
              agentName: this.name,
              collaborationType: 'analysis'
            });
            break;
          }

          case 'unknown': {
            console.log(`[${this.name}] Task type unclear, requesting clarification`);
            // Update task status
            task.status = 'pending';
            this.tasks.set(data.taskId, task);
            
            // Request clarification from observer
            this.eventBus.emit('task-manager-observer', {
              taskId: data.taskId,
              task: task.task,
              type: 'clarify'
            });

            // System event for clarification request
            this.eventBus.emit('agent-action', {
              agent: this.name,
              action: `Requested clarification for task ${data.taskId}`
            });
            break;
          }
        }
        return;
      }

      // Handle completion and failure cases
      if (data.status === 'completed') {
        task.status = 'completed';
        this.tasks.set(data.taskId, task);
        
        // Store the report if available
        if (data.result) {
          await storeReport(data.result);
        }

        // System event for completion
        this.eventBus.emit('agent-action', {
          agent: this.name,
          action: `Task ${data.taskId} completed successfully`
        });

        // Chat message for completion
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Task completed successfully:\n${JSON.stringify(data.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'completion'
        });
      } else if (data.status === 'failed') {
        task.status = 'failed';
        this.tasks.set(data.taskId, task);

        // System event for failure
        this.eventBus.emit('agent-action', {
          agent: this.name,
          action: `Task ${data.taskId} failed: ${data.result}`
        });

        // Chat message for failure
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Task failed: ${data.result}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'error'
        });
      }
    } catch (error) {
      console.error(`[${this.name}] Error handling executor result:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private getSystemPrompt(): string {
    return `You are a task manager agent responsible for:
1. Analyzing tasks from the observer agent
2. Breaking down complex tasks into executable steps
3. Coordinating with the executor agent
4. Maintaining task state and progress
5. Handling errors and retries

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

  async onStepFinish({ text, toolCalls, toolResults }: {
    text?: string;
    toolCalls?: any[];
    toolResults?: any[];
  }): Promise<void> {
    if (text) {
      await saveThought({
        agent: this.name,
        text,
        toolCalls: toolCalls || [],
        toolResults: toolResults || []
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
}
