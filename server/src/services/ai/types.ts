export interface AIResponse {
  text: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
  toolResults?: Array<{
    success: boolean;
    result: any;
    error?: string;
  }>;
}

export interface AIProvider {
  generateText: (
    prompt: string, 
    systemPrompt: string
  ) => Promise<AIResponse>;
  generateEmbeddings?: (text: string) => Promise<number[]>;
}

export interface AIConfig {
  provider: 'openai' | 'atoma';
  apiKey: string;
  enablePrivateCompute?: boolean;
  modelName?: string;
}

export interface ToolResult {
  success: boolean;
  result: any;
  error?: string;
}

export interface Tool {
  execute: (args: Record<string, any>) => Promise<ToolResult>;
  parameters: any;
  description: string;
} 