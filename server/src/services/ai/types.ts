export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: any[];
  toolResults?: any[];
}

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<AIResponse>;
  generateEmbeddings?(text: string): Promise<number[]>;
}

export interface AIConfig {
  provider: 'openai' | 'atoma';
  apiKey: string;
  enablePrivateCompute?: boolean;
  modelName?: string;
} 