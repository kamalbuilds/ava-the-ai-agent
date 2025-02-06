import type { AIConfig, AIProvider } from "./types";
import { AtomaProvider } from "./providers/atoma";
import { OpenAIProvider } from "./providers/openai";

export class AIFactory {
  static createProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'atoma':
        return new AtomaProvider(config.apiKey, config.enablePrivateCompute);
      case 'openai':
        return new OpenAIProvider(config.apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
} 