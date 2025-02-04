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
import { v4 as uuidv4 } from 'uuid';

const OBSERVER_STARTING_PROMPT = `Analyze the current market situation using Cookie API data. 
Focus on:
1. Top agents by mindshare
2. Recent relevant tweets and social sentiment
3. Specific agent performance metrics
Use this information to identify potential opportunities and risks.`;
const oldprompt = "Based on the current market data and the tokens that you hold, generate a report explaining what steps could be taken.";

interface AgentData {
  agentName: string;
  mindshare: number;
  marketCap: number;
  volume24Hours: number;
}

interface TweetData {
  text: string;
  engagementsCount: number;
  smartEngagementPoints: number;
}

/**
 * @dev The observer agent is responsible for generating a report about the best opportunities to make money.
 */
export class ObserverAgent extends Agent {
  private address: Hex;
  private account: Account;
  private isRunning: boolean = false;
  protected aiProvider: AIProvider;
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
    super(name, eventBus, aiProvider);
    this.account = account;
    this.address = account.address;
    this.aiProvider = aiProvider;
    this.tools = getObserverToolkit(this.address);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for task manager events
    this.eventBus.on('task-manager-observer', async (data) => {
      console.log(`[${this.name}] Received task-manager-observer event:`, data);
      try {
        if (data.type === 'analyze') {
          await this.handleTaskManagerEvent(data);
        }
      } catch (error) {
        console.error(`[${this.name}] Error handling task-manager-observer event:`, error);
        this.eventBus.emit('agent-error', {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Listen for market updates
    this.eventBus.on('market-update', async (data) => {
      await this.handleMarketUpdate(data);
    });

    // Listen for sentiment updates
    this.eventBus.on('sentiment-update', async (data) => {
      await this.handleSentimentUpdate(data);
    });
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
    try {
      console.log(`[${this.name}] Processing task manager event:`, data);
      
      // System event for sidebar
      this.eventBus.emit('agent-action', {
        agent: this.name,
        action: `Starting analysis of task: ${data.taskId}`
      });

      // Execute tools from toolkit
      console.log(`[${this.name}] ========== Starting Tool Execution ==========`);
      const toolResults = [];

      // Get market data
      console.log(`[${this.name}] Executing getMarketData tool...`);
      const marketDataResult = await this.tools.getMarketData.execute({}, {
        toolCallId: `market-data-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      toolResults.push({
        tool: 'getMarketData',
        result: marketDataResult
      });
      
      if (marketDataResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Market Analysis:\n${JSON.stringify(marketDataResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'tool-result'
        });
      }

      // Get wallet balances
      console.log(`[${this.name}] Executing getWalletBalances tool...`);
      const balancesResult = await this.tools.getWalletBalances.execute({}, {
        toolCallId: `balances-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      toolResults.push({
        tool: 'getWalletBalances',
        result: balancesResult
      });

      if (balancesResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Wallet Balances:\n${JSON.stringify(balancesResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'tool-result'
        });
      }

      // Get top agents data
      console.log(`[${this.name}] Executing getTopAgents tool...`);
      const topAgentsResult = await this.tools.getTopAgents.execute({
        interval: '_7Days',
        page: 1,
        pageSize: 5
      }, {
        toolCallId: `top-agents-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      toolResults.push({
        tool: 'getTopAgents',
        result: topAgentsResult
      });

      if (topAgentsResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Top Agents Analysis:\n${JSON.stringify(topAgentsResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'tool-result'
        });
      }

      // Search relevant tweets
      console.log(`[${this.name}] Executing searchCookieTweets tool...`);
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const tweetsResult = await this.tools.searchCookieTweets.execute({
        query: "crypto trading strategy",
        fromDate: lastWeek.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0]
      }, {
        toolCallId: `tweets-${data.taskId}`,
        messages: [],
        severity: 'info'
      });
      toolResults.push({
        tool: 'searchCookieTweets',
        result: tweetsResult
      });

      if (tweetsResult.success) {
        this.eventBus.emit('agent-message', {
          role: 'assistant',
          content: `Social Sentiment Analysis:\n${JSON.stringify(tweetsResult.result, null, 2)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName: this.name,
          collaborationType: 'tool-result'
        });
      }

      console.log(`[${this.name}] ========== Tool Execution Complete ==========`);
      console.log(`[${this.name}] Tool Results:`, JSON.stringify(toolResults, null, 2));

      // Generate final analysis using AI
      console.log(`[${this.name}] Generating final analysis...`);
      const systemPrompt = getObserverSystemPrompt(this.address);
      const response = await this.aiProvider.generateText(
        `Based on the following data, provide a comprehensive analysis and recommendations:\n${JSON.stringify(toolResults, null, 2)}`,
        systemPrompt.content
      );

      // Send analysis back to task manager
      this.eventBus.emit('observer-task-manager', {
        taskId: data.taskId,
        type: 'analysis',
        result: response.text,
        toolResults,
        timestamp: new Date().toISOString()
      });

      // Save the thought
      await saveThought({
        agent: this.name,
        text: response.text,
        toolCalls: response.toolCalls || [],
        toolResults
      });

    } catch (error) {
      console.error(`[${this.name}] Error handling task manager event:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
      const taskId = uuidv4();
      console.log(`[${this.name}] Starting to process task with ID: ${taskId}`);
      
      // Execute tools from toolkit
      console.log(`[${this.name}] ========== Starting Tool Execution ==========`);
      const toolResults = [];

      // Get market data (focus on key metrics)
      console.log(`[${this.name}] Executing getMarketData tool...`);
      const marketDataResult = await this.tools.getMarketData.execute({}, {
        toolCallId: taskId,
        messages: [],
        severity: 'info'
      });
      if (marketDataResult.success) {
        toolResults.push({
          tool: 'getMarketData',
          result: marketDataResult.result
        });
      }

      // Get top agents data (limit to top 3)
      console.log(`[${this.name}] Executing getTopAgents tool...`);
      const topAgentsResult = await this.tools.getTopAgents.execute({
        interval: '_7Days',
        page: 1,
        pageSize: 3
      }, {
        toolCallId: taskId,
        messages: [],
        severity: 'info'
      });
      if (topAgentsResult.success) {
        toolResults.push({
          tool: 'getTopAgents',
          result: {
            topAgents: topAgentsResult.result.ok.data.slice(0, 3).map((agent: AgentData) => ({
              name: agent.agentName,
              mindshare: agent.mindshare,
              marketCap: agent.marketCap,
              volume24Hours: agent.volume24Hours
            }))
          }
        });
      }

      // Search relevant tweets (limit to most relevant)
      console.log(`[${this.name}] Executing searchCookieTweets tool...`);
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const tweetsResult = await this.tools.searchCookieTweets.execute({
        query: "crypto trading strategy",
        fromDate: lastWeek.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0]
      }, {
        toolCallId: taskId,
        messages: [],
        severity: 'info'
      });
      if (tweetsResult.success && tweetsResult.result) {
        // Ensure we have an array of tweets and safely access it
        const tweets = Array.isArray(tweetsResult.result) ? tweetsResult.result : 
                      tweetsResult.result.data ? tweetsResult.result.data : [];
        
        toolResults.push({
          tool: 'searchCookieTweets',
          result: {
            topTweets: tweets.slice(0, 3).map((tweet: TweetData) => ({
              text: tweet.text.substring(0, 200) + '...',
              engagements: tweet.engagementsCount,
              sentiment: tweet.smartEngagementPoints
            }))
          }
        });
      }

      console.log(`[${this.name}] ========== Tool Execution Complete ==========`);

      // Generate final analysis using AI
      console.log(`[${this.name}] Generating final analysis...`);
      const systemPrompt = getObserverSystemPrompt(this.address);
      const response = await this.aiProvider.generateText(
        `Based on the following market data and social sentiment analysis, provide a comprehensive analysis and actionable recommendations:\n${JSON.stringify(toolResults, null, 2)}`,
        systemPrompt.content
      );

      // Send analysis to task manager
      this.eventBus.emit('observer-task-manager', {
        taskId,
        type: 'analysis',
        result: response.text,
        toolResults,
        timestamp: new Date().toISOString()
      });

      // Save the thought
      await saveThought({
        agent: this.name,
        text: response.text,
        toolCalls: response.toolCalls || [],
        toolResults
      });

    } catch (error) {
      console.error(`[${this.name}] Error processing task:`, error);
      this.eventBus.emit('agent-error', {
        agent: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
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
