import { generateText } from "ai";
import type { EventBus } from "../../comms";
import { Agent } from "../agent";
import { openai } from "@ai-sdk/openai";
import { getObserverSystemPrompt } from "../../system-prompts";
import type { Hex, Account } from "viem";
import { getObserverToolkit } from "./toolkit";
import { saveThought } from "../../memory";
import env from "../../env";

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
  address?: Hex;
  private account: Account;
  private isRunning: boolean = false;

  /**
   * @param name - The name of the agent
   * @param eventBus - The event bus to emit events to other agents
   * @param account - The account to observe
   */
  constructor(name: string, eventBus: EventBus, account: Account) {
    super(name, eventBus);
    this.account = account;
    // Initialize with the account address
    this.address = account.address;
  }

  /**
   * @param event - The event to handle
   * @param data - The data to handle
   */
  async handleEvent(event: string, data: any): Promise<void> {
    switch (event) {
      case `task-manager-${this.name}`:
        return this.handleTaskManagerEvent(data);
    }
  }

  /**
   * @param data - The data to handle
   */
  private async handleTaskManagerEvent(data: any): Promise<void> {
    if (data) {
      console.log(
        `[${this.name}] received message from task-manager: ${data.result}`
      );
    }

    await this.start(data);
  }

  /**
   * @dev Starts the observer agent
   * @param taskManagerData - The data from the task manager agent
   */
  async start(taskManagerData?: any): Promise<any> {
    if (!this.address) {
      throw new Error("Observer agent not initialized with account address");
    }

    // Emit event when starting
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Starting market analysis'
    });

    const toolkit = getObserverToolkit(this.address);

    try {
      if (!taskManagerData) {
        const response = await generateText({
          model: openai(env.MODEL_NAME),
          system: getObserverSystemPrompt(this.address),
          messages: [{
            role: "user",
            content: OBSERVER_STARTING_PROMPT
          }],
          tools: toolkit,
          maxSteps: 100,
          onStepFinish: this.onStepFinish,
        });

        this.eventBus.emit(`${this.name}-task-manager`, {
          report: response.text,
        });
      } else {
        const response = await generateText({
          model: openai(env.MODEL_NAME),
          system: getObserverSystemPrompt(this.address),
          messages: [
            {
              role: "assistant",
              content: taskManagerData.report,
            },
            {
              role: "user",
              content: `This is the feedback from the task executor agent:\n${taskManagerData.result}`
            }
          ],
          tools: toolkit,
          maxSteps: 100,
          onStepFinish: this.onStepFinish,
        });

        if (response.toolCalls.length > 0) {
          const noFurtherActionsTool = response.toolCalls.find(
            (tool: any) => tool.toolName === "noFurtherActionsTool"
          );
          if (noFurtherActionsTool) {
            this.eventBus.emit(`${this.name}-task-manager`, {
              noFurtherActions: true,
              // @ts-ignore
              waitTime: noFurtherActionsTool.args.waitTime * 1000,
            });
          }
        } else {
          this.eventBus.emit(`${this.name}-task-manager`, {
            report: response.text,
          });
        }
      }
    } catch (error) {
      console.error("Error in observer start:", error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: 'Failed to analyze market'
      });
    }
  }

  /**
   * @param data - The data to handle
   */
  async onStepFinish({ text, toolCalls, toolResults }: any) {
    console.log(
      `[observer] step finished. tools called: ${toolCalls.length > 0
        ? toolCalls.map((tool: any) => tool.toolName).join(", ")
        : "none"
      }`
    );
    if (text) {
      await saveThought({
        agent: "observer",
        text,
        toolCalls,
        toolResults,
      });
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Stopping observation'
    });
  }

  async processTask(task: string): Promise<void> {
    if (!this.address) {
      throw new Error("Observer agent not initialized with account address");
    }

    this.isRunning = true;

    this.eventBus.emit('agent-action', {
      agent: this.name,
      action: 'Analyzing task: ' + task
    });

    try {
      const response = await generateText({
        model: openai(env.MODEL_NAME),
        system: getObserverSystemPrompt(this.address),
        prompt: task,
        tools: getObserverToolkit(this.address),
        maxSteps: 100,
        onStepFinish: (data) => {
          // Emit intermediate steps as messages
          if (data.text) {
            this.eventBus.emit('agent-response', {
              agent: this.name,
              message: data.text,
              collaborationType: 'analysis'
            });
          }
          this.onStepFinish(data);
        },
      });

      // Emit final analysis
      this.eventBus.emit('agent-response', {
        agent: this.name,
        message: response.text,
        collaborationType: 'analysis'
      });

      // Send to task manager
      this.eventBus.emit(`${this.name}-task-manager`, {
        report: response.text,
        task
      });
    } catch (error) {
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: 'Failed to analyze task'
      });
    }
  }

  private async analyzeTask(task: string): Promise<string> {
    // Implement task analysis logic
    // This should use your existing AI tools to analyze the task
    // and determine the best course of action
    return "Task analysis result";
  }
}
