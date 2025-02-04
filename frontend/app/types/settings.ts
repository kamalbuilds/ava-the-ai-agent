export interface AIProviderSettings {
  provider: 'openai' | 'atoma';
  apiKey: string;
  modelName?: string;
}

export interface AgentSettings {
  aiProvider: AIProviderSettings;
  walletKey: string;
  enablePrivateCompute: boolean;
  additionalSettings: {
    brianApiKey?: string;
    coingeckoApiKey?: string;
    zerionApiKey?: string;
    perplexityApiKey?: string;
  };
} 