import axios from 'axios';
import { connect, keyStores, utils, Account } from 'near-api-js';
import { NearConfig } from './index';
import { 
  Pool, 
  TokenMetadata, 
  TokenPriceParams, 
  TokenPriceResponse, 
  PoolsResponse 
} from './types';

/**
 * API client for interacting with Ref Finance on NEAR Protocol
 */
export class RefApiClient {
  private config: NearConfig;
  private refFinanceApiBase: string;
  private nearConnection: any = null;

  constructor(config: NearConfig) {
    this.config = config;
    this.refFinanceApiBase = 'https://api.stats.ref.finance/api/';
  }

  /**
   * Initialize connection to NEAR Protocol
   */
  public async initialize(): Promise<void> {
    try {
      const keyStore = new keyStores.InMemoryKeyStore();
      const connectionConfig = {
        networkId: this.config.networkId,
        keyStore,
        nodeUrl: this.config.nodeUrl,
        walletUrl: this.config.walletUrl,
        helperUrl: this.config.helperUrl,
      };

      this.nearConnection = await connect(connectionConfig);
      console.log(`[RefApiClient] Successfully connected to NEAR ${this.config.networkId}`);
    } catch (error) {
      console.error(`[RefApiClient] Error connecting to NEAR: ${error}`);
      throw error;
    }
  }

  /**
   * Get account object for a given accountId
   */
  public async getAccount(accountId: string): Promise<Account> {
    if (!this.nearConnection) {
      await this.initialize();
    }
    return await this.nearConnection.account(accountId);
  }

  /**
   * Get metadata for a token
   */
  public async getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
    try {
      if (tokenId === 'near') {
        return {
          id: 'near',
          name: 'NEAR',
          symbol: 'NEAR',
          decimals: 24,
          icon: 'data:image/svg+xml,%3Csvg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cg clip-path="url(%23clip0_37_158)"%3E%3Cpath d="M19.3539 16.1366L14.5202 22.751L11.64 18.4612L14.5202 14.1747L19.3539 16.1366Z" fill="white"/%3E%3Cpath d="M14.5205 1.72095L27.8223 11.5162L25.5451 12.6371L19.3539 9.52019L9.68652 10.3988L14.5205 1.72095Z" fill="white"/%3E%3Cpath d="M14.5203 14.1747L11.64 18.4612L7.61883 14.1747H14.5203Z" fill="white"/%3E%3Cpath d="M19.3539 9.52019V16.1366L14.5202 14.1747V6.61913L19.3539 9.52019Z" fill="white"/%3E%3Cpath d="M19.3539 9.52019L25.5451 12.6371L19.3539 16.1366V9.52019Z" fill="white"/%3E%3Cpath d="M7.61883 14.1747L9.68652 10.3988L4.85278 14.1747H7.61883Z" fill="white"/%3E%3Cpath d="M11.64 18.4612L7.61883 14.1747H4.85278L11.64 23.8525V18.4612Z" fill="white"/%3E%3Cpath d="M14.5202 29.2388L1.21844 19.4435L3.49568 18.3226L9.68687 21.4395L19.3543 20.5576L14.5202 29.2388Z" fill="white"/%3E%3Cpath d="M14.5205 6.61913V14.1747H7.61902L14.5205 6.61913Z" fill="white"/%3E%3Cpath d="M14.5202 22.7509L19.3539 20.5576L14.5202 29.2388V22.7509Z" fill="white"/%3E%3Cpath d="M19.3539 20.5576L21.4216 16.7817L26.2553 20.5576H19.3539Z" fill="white"/%3E%3Cpath d="M14.5202 29.2388L19.3539 20.5576H26.2553L19.3539 29.2388H14.5202Z" fill="white"/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id="clip0_37_158"%3E%3Crect width="26.6039" height="27.5178" fill="white" transform="translate(1.21844 1.72095)"/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E'
        };
      }

      const account = await this.getAccount(tokenId.split('.')[0]);
      return await account.viewFunction({
        contractId: tokenId,
        methodName: 'ft_metadata',
        args: {}
      });
    } catch (error) {
      console.error(`[RefApiClient] Error getting token metadata for ${tokenId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all pools from Ref Finance
   */
  public async getPools(): Promise<PoolsResponse> {
    try {
      // First get regular pools
      const simplePools = await this.fetchPools('/list-pools');
      
      // Then get stable pools
      const stablePools = await this.fetchPools('/list-stable-pools');
      
      // Combine the pools
      const allPools = [...simplePools, ...stablePools];
      
      // Get token metadata for all tokens in the pools
      const uniqueTokenIds = new Set<string>();
      allPools.forEach(pool => {
        pool.token_account_ids.forEach(tokenId => {
          uniqueTokenIds.add(tokenId);
        });
      });
      
      // Fetch metadata for all tokens
      const tokenMetadataPromises = Array.from(uniqueTokenIds).map(tokenId => 
        this.getTokenMetadata(tokenId)
          .catch(error => {
            console.error(`[RefApiClient] Error fetching metadata for ${tokenId}: ${error}`);
            return {
              id: tokenId,
              name: tokenId,
              symbol: tokenId.split('.')[0].toUpperCase(),
              decimals: 18
            } as TokenMetadata;
          })
      );
      
      const tokenMetadatas = await Promise.all(tokenMetadataPromises);
      const tokenMetadataMap = new Map<string, TokenMetadata>();
      tokenMetadatas.forEach(metadata => {
        tokenMetadataMap.set(metadata.id, metadata);
      });
      
      // Attach token metadata to pools
      const poolsWithTokens = allPools.map(pool => {
        const tokens = pool.token_account_ids.map(tokenId => {
          return tokenMetadataMap.get(tokenId) || {
            id: tokenId,
            name: tokenId,
            symbol: tokenId.split('.')[0].toUpperCase(),
            decimals: 18
          };
        });
        
        return {
          ...pool,
          tokens
        };
      });
      
      return {
        success: true,
        pools: poolsWithTokens
      };
    } catch (error) {
      console.error(`[RefApiClient] Error getting pools: ${error}`);
      return {
        success: false,
        error: `Error fetching pools: ${error}`
      };
    }
  }

  /**
   * Fetch pools from Ref Finance API
   */
  private async fetchPools(endpoint: string): Promise<Pool[]> {
    try {
      const response = await axios.get(`${this.refFinanceApiBase}${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`[RefApiClient] Error fetching pools from ${endpoint}: ${error}`);
      return [];
    }
  }

  /**
   * Get price of a token in terms of another token
   */
  public async getTokenPrice(params: TokenPriceParams): Promise<TokenPriceResponse> {
    try {
      const { token_id, quote_id = 'wrap.near' } = params;
      
      // Special case: if token_id is the same as quote_id, price is 1
      if (token_id === quote_id) {
        return {
          success: true,
          price: 1,
          quote_token: quote_id,
          timestamp: new Date().toISOString()
        };
      }
      
      // Use the official Ref Finance API
      const response = await axios.get(`${this.refFinanceApiBase}/token-price`, {
        params: {
          token_id,
          quote_id
        }
      });
      
      if (response.data && response.data.price !== undefined) {
        return {
          success: true,
          price: response.data.price,
          quote_token: quote_id,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: `Price not available for ${token_id} in terms of ${quote_id}`
        };
      }
    } catch (error) {
      console.error(`[RefApiClient] Error getting token price: ${error}`);
      return {
        success: false,
        error: `Error fetching token price: ${error}`
      };
    }
  }

  /**
   * Get token balance for an account
   */
  public async getTokenBalance(accountId: string, tokenId: string): Promise<string> {
    try {
      if (tokenId === 'near') {
        const account = await this.getAccount(accountId);
        const balance = await account.getAccountBalance();
        return balance.available;
      }
      
      const account = await this.getAccount(accountId);
      return await account.viewFunction({
        contractId: tokenId,
        methodName: 'ft_balance_of',
        args: { account_id: accountId }
      });
    } catch (error) {
      console.error(`[RefApiClient] Error getting token balance: ${error}`);
      return '0';
    }
  }
}
