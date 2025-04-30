import axios from 'axios';

/**
 * Network ID type (mainnet or testnet)
 */
enum NetworkId {
  MAINNET = 'mainnet',
  TESTNET = 'testnet'
}

/**
 * Network configuration
 */
interface NetworkConfig {
  networkId: NetworkId;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  refFinanceBaseUrl: string;
  indexerApiUrl: string;
}

/**
 * Network configurations for mainnet and testnet
 */
const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  [NetworkId.MAINNET]: {
    networkId: NetworkId.MAINNET,
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.mainnet.near.org',
    refFinanceBaseUrl: 'https://api.ref.finance',
    indexerApiUrl: 'https://indexer.ref.finance'
  },
  [NetworkId.TESTNET]: {
    networkId: NetworkId.TESTNET,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    refFinanceBaseUrl: 'https://testnet-api.ref.finance',
    indexerApiUrl: 'https://testnet-indexer.ref.finance'
  }
};

/**
 * Get network configuration for a given network ID
 */
function getNetworkConfig(networkId: NetworkId): NetworkConfig {
  return NETWORK_CONFIGS[networkId];
}

/**
 * Token metadata interface
 */
interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

/**
 * Pool information interface
 */
interface Pool {
  id: number;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
}

/**
 * Function to retry async operations with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 500,
  errorMessage: string = 'Operation failed after multiple retries'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log(`Retrying operation, ${retries} attempts remaining...`);
    
    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return retry(fn, retries - 1, delay * 2, errorMessage);
  }
}

/**
 * Client for interacting with Ref Finance API
 */
export class RefApiClient {
  private readonly baseUrl: string;
  private readonly networkId: NetworkId;
  private readonly axios: any;
  private tokenMetadataCache: Map<string, TokenMetadata> = new Map();
  private poolsCache: Array<any> = [];
  private poolsCacheTimestamp: number = 0;
  private readonly POOLS_CACHE_TTL_MS = 30000; // 30 seconds

  /**
   * Create a new Ref Finance API client
   * @param networkId Network ID (mainnet or testnet)
   */
  constructor(networkId: NetworkId = NetworkId.MAINNET) {
    this.networkId = networkId;
    const networkConfig = getNetworkConfig(networkId);
    this.baseUrl = networkConfig.refFinanceBaseUrl;
    
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Initialized RefApiClient for ${networkId}`);
  }

  /**
   * Ensure client is initialized
   * @private
   */
  private ensureInitialized(): void {
    if (!this.axios) {
      throw new Error('RefApiClient is not initialized');
    }
  }

  /**
   * Fetch all pools from the API
   * @param forceFresh Force a fresh fetch, ignoring cache
   * @returns Array of pool objects
   */
  async fetchPools(forceFresh: boolean = false): Promise<Array<any>> {
    this.ensureInitialized();
    
    const now = Date.now();
    const isCacheValid = 
      this.poolsCache.length > 0 && 
      (now - this.poolsCacheTimestamp < this.POOLS_CACHE_TTL_MS);
    
    if (!forceFresh && isCacheValid) {
      console.log(`Using cached pools (${this.poolsCache.length} pools)`);
      return this.poolsCache;
    }
    
    console.log('Fetching pools from Ref Finance API');
    
    try {
      const response = await retry(
        () => this.axios.get('/list-pools'),
        3,
        500,
        'Failed to fetch pools from Ref Finance API'
      );
      
      this.poolsCache = response.data || [];
      this.poolsCacheTimestamp = now;
      
      console.log(`Successfully fetched ${this.poolsCache.length} pools`);
      return this.poolsCache;
    } catch (error) {
      console.error(`Error fetching pools: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get pool by ID
   * @param poolId Pool ID to lookup
   * @returns Pool data or null if not found
   */
  async getPoolById(poolId: number): Promise<any | null> {
    const pools = await this.fetchPools();
    const pool = pools.find(p => p.id === poolId);
    
    if (!pool) {
      console.warn(`Pool with ID ${poolId} not found`);
      return null;
    }
    
    return pool;
  }

  /**
   * Get token metadata
   * @param tokenId Token ID to fetch metadata for
   * @returns Token metadata
   */
  async getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
    this.ensureInitialized();
    
    // Check cache first
    if (this.tokenMetadataCache.has(tokenId)) {
      return this.tokenMetadataCache.get(tokenId)!;
    }
    
    console.log(`Fetching metadata for token ${tokenId}`);
    
    try {
      const response = await retry(
        () => this.axios.get(`/token-metadata/${tokenId}`),
        3,
        500,
        `Failed to fetch metadata for token ${tokenId}`
      );
      
      const metadata = response.data.metadata as TokenMetadata;
      this.tokenMetadataCache.set(tokenId, metadata);
      
      return metadata;
    } catch (error) {
      console.error(`Error fetching token metadata for ${tokenId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get account balances for specified tokens
   * @param accountId NEAR account ID
   * @param tokenIds Array of token IDs to fetch balances for
   * @returns Object mapping token IDs to balances
   */
  async getAccountBalances(accountId: string, tokenIds: string[]): Promise<Record<string, string>> {
    this.ensureInitialized();
    
    console.log(`Fetching balances for account ${accountId}`);
    
    try {
      const response = await retry(
        () => this.axios.post('/account-balances', { account_id: accountId, token_ids: tokenIds }),
        3,
        500,
        `Failed to fetch balances for account ${accountId}`
      );
      
      return response.data.balances || {};
    } catch (error) {
      console.error(`Error fetching account balances: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get token price from the API
   * @param tokenId Token ID to get price for
   * @returns Token price in USD or null if not available
   */
  async getTokenPrice(tokenId: string): Promise<number | null> {
    this.ensureInitialized();
    
    try {
      const response = await retry(
        () => this.axios.get(`/token-price/${tokenId}`),
        3,
        500,
        `Failed to fetch price for token ${tokenId}`
      );
      
      const price = response.data?.price;
      if (price === undefined || price === null) {
        return null;
      }
      
      return parseFloat(price);
    } catch (error) {
      console.error(`Error fetching token price for ${tokenId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
} 