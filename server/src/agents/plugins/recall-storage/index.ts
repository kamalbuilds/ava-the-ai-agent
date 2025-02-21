import { RecallClient } from './client';

export interface RecallStorageConfig {
  endpoint: string;
  apiKey: string;
  namespace: string;
}

export class RecallStorage {
  private client: RecallClient;
  private namespace: string;

  constructor(config: RecallStorageConfig) {
    this.client = new RecallClient(config.endpoint, config.apiKey);
    this.namespace = config.namespace;
  }

  async store(
    key: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const fullKey = `${this.namespace}:${key}`;
    await this.client.store(fullKey, {
      data,
      metadata: metadata || {},
      timestamp: Date.now(),
    });
  }

  async retrieve(
    key: string
  ): Promise<{ data: any; metadata?: Record<string, any> }> {
    const fullKey = `${this.namespace}:${key}`;
    const result = await this.client.retrieve(fullKey);
    return {
      data: result.data,
      metadata: result.metadata,
    };
  }

  async storeCoT(
    key: string,
    thoughts: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    const fullKey = `${this.namespace}:cot:${key}`;
    await this.client.store(fullKey, {
      thoughts,
      metadata: metadata || {},
      timestamp: Date.now(),
    });
  }

  async retrieveCoT(
    key: string
  ): Promise<{ thoughts: string[]; metadata?: Record<string, any> }> {
    const fullKey = `${this.namespace}:cot:${key}`;
    const result = await this.client.retrieve(fullKey);
    return {
      thoughts: result.thoughts,
      metadata: result.metadata,
    };
  }

  async search(
    query: string,
    options?: {
      limit?: number;
      filter?: Record<string, any>;
    }
  ): Promise<Array<{ key: string; score: number; data: any }>> {
    return this.client.search(query, {
      namespace: this.namespace,
      ...options,
    });
  }
} 