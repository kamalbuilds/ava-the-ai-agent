import { generateText as aiGenerateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { AIProvider, AIResponse } from "../types";

// Define proper types for tool calls and results
interface ToolCall {
  name: string;
  args: Record<string, any>;
}

interface ToolResult {
  success: boolean;
  result: any;
  error?: string;
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = "gpt-3.5-turbo-instruct") {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const model = openai(this.modelName);
      
      const response = await aiGenerateText({
        model,
        system: systemPrompt,
        prompt,
        maxSteps: 100,
        maxRetries: 10,
        experimental_continueSteps: true
      });

      // Transform tool calls to match our interface
      const transformedToolCalls = (response.toolCalls || []).map(call => ({
        name: call.toolName,
        args: call.args
      }));

      return {
        text: response.text,
        toolCalls: transformedToolCalls,
        toolResults: response.toolResults || []
      };
    } catch (error) {
      console.error("OpenAI error:", error);
      throw error;
    }
  }
} 