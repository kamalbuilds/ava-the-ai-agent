import { RefApiClient } from './api-client';
import { 
  Pool, 
  PoolWithTokens, 
  PoolsResponse, 
  TokenMetadata 
} from '../types';
import { createLogger } from '../utils/logger';

/**
 * Service for managing pools in Ref Finance
 */
export class PoolService {
  private apiClient: RefApiClient;
  private poolsCache: PoolWithTokens[] | null = null;
  private poolsCacheTimestamp: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private logger = createLogger('PoolService');

  constructor(apiClient: RefApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get all pools from Ref Finance
   * @param forceRefresh Force a refresh of the pools cache
   * @returns A response containing the pools
   */
  public async getPools(forceRefresh: boolean = false): Promise<PoolsResponse> {
    try {
      // Check cache first
      if (!forceRefresh && this.poolsCache && (Date.now() - this.poolsCacheTimestamp < this.CACHE_TTL)) {
        this.logger.info(`Returning ${this.poolsCache.length} pools from cache`);
        return {
          success: true,
          pools: this.poolsCache
        };
      }

      // Fetch fresh data
      this.logger.info('Fetching pools from Ref Finance API');
      const poolsResponse = await this.apiClient.getPools();
      
      if (poolsResponse.success && poolsResponse.pools) {
        this.poolsCache = poolsResponse.pools;
        this.poolsCacheTimestamp = Date.now();
        this.logger.success(`Retrieved ${poolsResponse.pools.length} pools from API`);
      } else {
        this.logger.error(`Failed to fetch pools: ${poolsResponse.error}`);
      }
      
      return poolsResponse;
    } catch (error) {
      this.logger.error(`Error getting pools: ${error}`);
      return {
        success: false,
        error: `Error fetching pools: ${error}`
      };
    }
  }

  /**
   * Find pools containing a specific token
   * @param tokenId The token ID to search for
   * @returns An array of pools containing the token
   */
  public async findPoolsWithToken(tokenId: string): Promise<PoolWithTokens[]> {
    try {
      const poolsResponse = await this.getPools();
      
      if (!poolsResponse.success || !poolsResponse.pools) {
        this.logger.error(`Could not get pools to search for token ${tokenId}`);
        return [];
      }
      
      const pools = poolsResponse.pools.filter(pool => 
        pool.token_account_ids.includes(tokenId)
      );
      
      this.logger.info(`Found ${pools.length} pools containing token ${tokenId}`);
      return pools;
    } catch (error) {
      this.logger.error(`Error finding pools with token ${tokenId}: ${error}`);
      return [];
    }
  }

  /**
   * Find direct pools between two tokens
   * @param tokenInId The input token ID
   * @param tokenOutId The output token ID
   * @returns An array of pools that directly connect the two tokens
   */
  public async findDirectPools(tokenInId: string, tokenOutId: string): Promise<PoolWithTokens[]> {
    try {
      const poolsResponse = await this.getPools();
      
      if (!poolsResponse.success || !poolsResponse.pools) {
        this.logger.error(`Could not get pools to search for direct route ${tokenInId} -> ${tokenOutId}`);
        return [];
      }
      
      const pools = poolsResponse.pools.filter(pool => 
        pool.token_account_ids.includes(tokenInId) && 
        pool.token_account_ids.includes(tokenOutId)
      );
      
      this.logger.info(`Found ${pools.length} direct pools from ${tokenInId} to ${tokenOutId}`);
      return pools;
    } catch (error) {
      this.logger.error(`Error finding direct pools from ${tokenInId} to ${tokenOutId}: ${error}`);
      return [];
    }
  }

  /**
   * Get a pool by ID
   * @param poolId The pool ID to retrieve
   * @returns The pool if found, or null
   */
  public async getPoolById(poolId: number): Promise<PoolWithTokens | null> {
    try {
      const poolsResponse = await this.getPools();
      
      if (!poolsResponse.success || !poolsResponse.pools) {
        this.logger.error(`Could not get pools to find pool ${poolId}`);
        return null;
      }
      
      const pool = poolsResponse.pools.find(p => p.id === poolId);
      
      if (pool) {
        this.logger.info(`Found pool ${poolId} with tokens: ${pool.token_account_ids.join(', ')}`);
        return pool;
      } else {
        this.logger.warn(`Pool ${poolId} not found`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting pool by ID ${poolId}: ${error}`);
      return null;
    }
  }

  /**
   * Check if a token pair has available liquidity
   * @param tokenInId The input token ID
   * @param tokenOutId The output token ID
   * @returns True if there's a path with liquidity, false otherwise
   */
  public async checkPairLiquidity(tokenInId: string, tokenOutId: string): Promise<boolean> {
    try {
      // First check for direct pools
      const directPools = await this.findDirectPools(tokenInId, tokenOutId);
      if (directPools.length > 0) {
        return true;
      }
      
      // TODO: Add logic for checking multi-hop paths
      // This would require a more complex graph traversal algorithm
      
      return false;
    } catch (error) {
      this.logger.error(`Error checking pair liquidity: ${error}`);
      return false;
    }
  }
} 