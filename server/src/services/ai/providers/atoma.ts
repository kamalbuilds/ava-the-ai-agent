import { AtomaSDK } from "atoma-ts-sdk";
import type { AIProvider, AIResponse } from "../types";
import type { CompletionUsage } from "atoma-ts-sdk/models/components/completionusage";

export class AtomaProvider implements AIProvider {
  private sdk: AtomaSDK;
  private enablePrivateCompute: boolean;

  constructor(apiKey: string, enablePrivateCompute: boolean = false) {
    this.sdk = new AtomaSDK({
      bearerAuth: apiKey
    });
    this.enablePrivateCompute = enablePrivateCompute;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const messages = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ];

      const response = this.enablePrivateCompute ? 
        await this.sdk.confidentialChat.create({
          messages,
          model: "meta-llama/Llama-3.3-70B-Instruct"
        }) :
        await this.sdk.chat.create({
          messages,
          model: "meta-llama/Llama-3.3-70B-Instruct"
        });

      const usage: CompletionUsage = {
        completionTokens: response.usage?.completionTokens || 0,
        promptTokens: response.usage?.promptTokens || 0,
        totalTokens: response.usage?.totalTokens || 0
      };

      return {
        text: response.choices[0].message.content,
        usage,
        toolCalls: [],
        toolResults: []
      };
    } catch (error) {
      console.error("Atoma AI error:", error);
      throw error;
    }
  }
} 