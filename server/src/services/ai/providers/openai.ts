import { generateText as aiGenerateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { AIProvider, AIResponse } from "../types";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const model = openai("gpt-3.5-turbo-instruct");
      
      const response = await aiGenerateText({
        model,
        system: systemPrompt,
        prompt,
        maxSteps: 100,
        maxRetries: 10,
        experimental_continueSteps: true
      });

      return {
        text: response.text,
        usage: response.usage,
        toolCalls: response.toolCalls || [],
        toolResults: response.toolResults || []
      };
    } catch (error) {
      console.error("OpenAI error:", error);
      throw error;
    }
  }
} 