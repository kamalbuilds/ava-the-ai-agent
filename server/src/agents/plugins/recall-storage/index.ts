import { EventBus } from '../../../comms';
import env from '../../../env';
import type { Address, Hex } from 'viem';

export interface RecallStorageConfig {
  network?: string;
  syncInterval?: number;
  batchSize?: number;
  eventBus?: EventBus;
  bucketAlias?: string;
}

interface BucketObject {
  key: string;
  data: Uint8Array;
  metadata?: Record<string, unknown>;
}

interface BucketMetadata {
  alias: string;
  [key: string]: unknown;
}

interface RecallBucket {
  addr: Address;
  metadata: BucketMetadata;
}

interface RecallResult<T> {
  result: T;
}

export class RecallStorage {
  private client: any;
  private clientInitialized: Promise<void>;
  private syncIntervalId?: ReturnType<typeof setInterval>;
  private intervalMs: number;
  private batchSizeKB: number;
  private eventBus?: EventBus;
  private bucketAlias: string;

  constructor(config: RecallStorageConfig) {
    const privateKey = env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY is required in environment variables');
    }

    this.intervalMs = config.syncInterval || 2 * 60 * 1000; // Default 2 minutes
    this.batchSizeKB = config.batchSize || 4; // Default 4KB
    this.eventBus = config.eventBus;
    this.bucketAlias = config.bucketAlias || 'default-bucket';
    

    this.clientInitialized = this.initializeClient(privateKey).then(() => {
      this.startPeriodicSync();
    });
  }

  private async initializeClient(privateKey: string): Promise<void> {
    try {
      // Dynamic imports to handle ESM modules
      const { testnet } = await import('@recallnet/chains');
      const { RecallClient, walletClientFromPrivateKey } = await import('@recallnet/sdk/client');
      
      const wallet = walletClientFromPrivateKey(privateKey as Hex, testnet);
      this.client = new RecallClient({ walletClient: wallet });
    } catch (error) {
      console.error('Failed to initialize Recall client:', error);
      throw error;
    }
  }

  async waitForInitialization(): Promise<void> {
    await this.clientInitialized;
  }

  async store(
    key: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.waitForInitialization();

    const bucketManager = await this.client.bucketManager();
    const bucket = await this.getOrCreateBucket(this.bucketAlias);
    
    await bucketManager.add(
      bucket,
      key,
      new TextEncoder().encode(JSON.stringify({
        data,
        metadata: metadata || {},
        timestamp: Date.now(),
      }))
    );
  }

  async retrieve(
    key: string
  ): Promise<{ data: any; metadata?: Record<string, any> }> {
    await this.waitForInitialization();

    const bucketManager = await this.client.bucketManager();
    const bucket = await this.getOrCreateBucket(this.bucketAlias);
    
    const result = await bucketManager.get(bucket, key) as RecallResult<Uint8Array>;
    
    if (!result.result) {
      throw new Error(`No data found for key: ${key}`);
    }

    const decoded = new TextDecoder().decode(result.result);
    const parsed = JSON.parse(decoded);
    return {
      data: parsed.data,
      metadata: parsed.metadata,
    };
  }

  async storeCoT(
    key: string,
    thoughts: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.store(`cot:${key}`, {
      thoughts,
      metadata: metadata || {},
      timestamp: Date.now(),
    });
  }

  async retrieveCoT(
    key: string
  ): Promise<{ thoughts: string[]; metadata?: Record<string, any> }> {
    const result = await this.retrieve(`cot:${key}`);
    return {
      thoughts: result.data.thoughts,
      metadata: result.data.metadata,
    };
  }

  async search(
    query: string,
    options?: {
      limit?: number;
      filter?: Record<string, any>;
    }
  ): Promise<Array<{ key: string; score: number; data: any }>> {
    const bucketAddress = await this.getOrCreateBucket(this.bucketAlias);
    const result = await this.client.bucketManager().query(bucketAddress, {
      prefix: query,
      limit: options?.limit,
    }) as RecallResult<{ objects: { key: string; data: Uint8Array }[] }>;

    if (!result.result?.objects) {
      return [];
    }

    return result.result.objects
      .filter(obj => {
        if (!options?.filter) return true;
        try {
          const decoded = new TextDecoder().decode(obj.data);
          const parsed = JSON.parse(decoded);
          return Object.entries(options.filter).every(
            ([key, value]) => parsed.metadata?.[key] === value
          );
        } catch {
          return false;
        }
      })
      .map(obj => {
        const decoded = new TextDecoder().decode(obj.data);
        const parsed = JSON.parse(decoded);
        return {
          key: obj.key,
          score: 1, // Recall doesn't provide relevance scores
          data: parsed.data,
        };
      });
  }

  async getOrCreateBucket(bucketAlias: string): Promise<Address> {
    await this.waitForInitialization();

    try {
      const bucketManager = await this.client.bucketManager();
      const buckets = await bucketManager.list() as RecallResult<{ buckets: RecallBucket[] }>;
      
      if (buckets?.result?.buckets) {
        const bucket = buckets.result.buckets.find((b: RecallBucket) => 
          b.metadata?.alias === bucketAlias
        );
        if (bucket) {
          return bucket.addr;
        }
      }

      const result = await bucketManager.create({
        metadata: { alias: bucketAlias },
      }) as RecallResult<{ bucket: Address }>;

      if (!result.result) {
        throw new Error(`Failed to create bucket: ${bucketAlias}`);
      }

      return result.result.bucket;
    } catch (error) {
      const err = error as Error;
      console.error(`Error in getOrCreateBucket: ${err.message}`);
      throw error;
    }
  }

  private startPeriodicSync(): void {
    if (this.syncIntervalId) {
      return;
    }

    this.syncIntervalId = setInterval(async () => {
      try {
        await this.syncLogsToRecall();
      } catch (error) {
        console.error('Error in periodic log sync:', error);
      }
    }, this.intervalMs);

    // Initial sync
    this.syncLogsToRecall().catch(error => {
      console.error('Error in initial log sync:', error);
    });
  }

  stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }
  }

  private async syncLogsToRecall(): Promise<void> {
    await this.waitForInitialization();

    try {
      const bucketAddress = await this.getOrCreateBucket(this.bucketAlias);
      const result = await this.client.bucketManager().query(bucketAddress, {
        prefix: 'log:',
      }) as RecallResult<{ objects: { key: string; data: Uint8Array }[] }>;

      if (!result.result?.objects) {
        return;
      }

      let batch: string[] = [];
      let batchSize = 0;

      for (const obj of result.result.objects) {
        try {
          const decoded = new TextDecoder().decode(obj.data);
          const parsed = JSON.parse(decoded);
          
          if (parsed.metadata?.synced) continue;

          const logEntry = JSON.stringify({
            key: obj.key,
            data: parsed.data,
            metadata: parsed.metadata,
            timestamp: parsed.timestamp,
          });

          const logSize = new TextEncoder().encode(logEntry).length;
          if (batchSize + logSize > this.batchSizeKB * 1024) {
            await this.storeBatchToRecall(batch);
            batch = [];
            batchSize = 0;
          }

          batch.push(logEntry);
          batchSize += logSize;
        } catch (error) {
          console.error('Error processing log entry:', error);
          continue;
        }
      }

      if (batch.length > 0) {
        await this.storeBatchToRecall(batch);
      }
    } catch (error) {
      console.error('Error syncing logs to Recall:', error);
      throw error;
    }
  }

  private async storeBatchToRecall(batch: string[]): Promise<void> {
    await this.waitForInitialization();

    try {
      const bucketAddress = await this.getOrCreateBucket(this.bucketAlias);
      const timestamp = Date.now();
      const batchKey = `batch:${timestamp}`;
      const batchData = batch.join('\n');

      await this.client.bucketManager().add(
        bucketAddress,
        batchKey,
        new TextEncoder().encode(batchData),
      );

      // Mark logs as synced
      for (const logEntry of batch) {
        const parsed = JSON.parse(logEntry);
        await this.client.bucketManager().add(
          bucketAddress,
          parsed.key,
          new TextEncoder().encode(JSON.stringify({
            ...parsed,
            metadata: {
              ...parsed.metadata,
              synced: true,
              syncedAt: timestamp,
            },
          }))
        );
      }
    } catch (error) {
      console.error('Error storing batch to Recall:', error);
      throw error;
    }
  }
} 