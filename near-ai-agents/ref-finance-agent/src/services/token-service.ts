import axios from 'axios';
import { createLogger } from '../utils/logger';
import { NetworkId } from '../types/networkTypes';
import { RefApiClient } from './api-client';
import { TokenMetadata } from '../types/tokenTypes';
import { 
  TokenBalance, 
  TokenBalancesResponse, 
  TokenPriceParams,
  TokenPriceResponse
} from '../types';
import { BigNumber } from 'bignumber.js';
import { POPULAR_TOKENS } from '../utils/config';

const logger = createLogger('TokenService');

/**
 * Service for managing tokens in Ref Finance
 */
export class TokenService {
  private apiClient: RefApiClient;
  private tokenMetadataCache: Map<string, TokenMetadata> = new Map();
  private tokenPriceCache: Map<string, number> = new Map();
  
  constructor(networkId: NetworkId) {
    this.apiClient = new RefApiClient(networkId);
    logger.info('TokenService initialized');
  }

  /**
   * Get token metadata by token ID
   * @param tokenId The token ID
   * @returns TokenMetadata object
   */
  async getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
    try {
      // Check cache first
      if (this.tokenMetadataCache.has(tokenId)) {
        return this.tokenMetadataCache.get(tokenId)!;
      }
      
      // Fetch from API if not in cache
      const metadata = await this.apiClient.getTokenMetadata(tokenId);
      
      // Cache the result
      this.tokenMetadataCache.set(tokenId, metadata);
      
      return metadata;
    } catch (error) {
      logger.error(`Failed to get metadata for token ${tokenId}:`, error);
      throw new Error(`Failed to get metadata for token ${tokenId}: ${error}`);
    }
  }

  /**
   * Get token price in USD
   * @param tokenId The token ID
   * @returns Token price in USD
   */
  async getTokenPrice(tokenId: string): Promise<number> {
    try {
      // Check cache first (we might want to set a TTL for price cache)
      if (this.tokenPriceCache.has(tokenId)) {
        return this.tokenPriceCache.get(tokenId)!;
      }
      
      // Get price from API
      const price = await this.apiClient.getTokenPrice(tokenId);
      
      // Cache the result
      this.tokenPriceCache.set(tokenId, price);
      
      return price;
    } catch (error) {
      logger.error(`Failed to get price for token ${tokenId}:`, error);
      throw new Error(`Failed to get price for token ${tokenId}: ${error}`);
    }
  }

  /**
   * Get token balances for an account
   * @param accountId The account ID
   * @param tokenIds Optional list of token IDs to fetch, fetches all if not provided
   * @returns Map of token ID to formatted balance
   */
  async getTokenBalances(accountId: string, tokenIds?: string[]): Promise<Map<string, string>> {
    try {
      // Get balances from API
      const balances = await this.apiClient.getAccountBalances(accountId);
      
      // Filter by tokenIds if provided
      const filteredBalances = new Map<string, string>();
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (!tokenIds || tokenIds.includes(tokenId)) {
          // Get token metadata to format the balance
          const metadata = await this.getTokenMetadata(tokenId);
          filteredBalances.set(tokenId, this.formatBalance(balance, metadata.decimals));
        }
      }
      
      return filteredBalances;
    } catch (error) {
      logger.error(`Failed to get token balances for account ${accountId}:`, error);
      throw new Error(`Failed to get token balances for account ${accountId}: ${error}`);
    }
  }

  /**
   * Format token balance based on decimals
   * @param balance The raw balance string
   * @param decimals Number of decimals the token has
   * @returns Formatted balance string
   */
  private formatBalance(balance: string, decimals: number): string {
    const balanceNum = BigInt(balance);
    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = balanceNum / divisor;
    const fractionalPart = balanceNum % divisor;
    
    // Pad the fractional part with leading zeros if needed
    let fractionalStr = fractionalPart.toString();
    fractionalStr = fractionalStr.padStart(decimals, '0');
    
    // Trim trailing zeros
    fractionalStr = fractionalStr.replace(/0+$/, '');
    
    if (fractionalStr.length > 0) {
      return `${wholePart}.${fractionalStr}`;
    } else {
      return wholePart.toString();
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.tokenMetadataCache.clear();
    this.tokenPriceCache.clear();
    logger.info('TokenService caches cleared');
  }

  /**
   * Get token price in terms of another token
   */
  public async getTokenPriceInTerms(params: TokenPriceParams): Promise<TokenPriceResponse> {
    try {
      const { token_id, quote_id = 'wrap.near' } = params;
      
      // Check cache first
      const cacheKey = `${token_id}:${quote_id}`;
      const cachedPrice = this.tokenPriceCache.get(cacheKey);
      
      if (cachedPrice && (Date.now() - cachedPrice < 5 * 60 * 1000)) {
        return {
          success: true,
          price: cachedPrice,
          quote_token: quote_id,
          timestamp: new Date(Date.now()).toISOString()
        };
      }

      // Get price from API
      const priceResponse = await this.apiClient.getTokenPrice(params);
      
      // Cache the price if successful
      if (priceResponse.success && priceResponse.price !== undefined) {
        this.tokenPriceCache.set(cacheKey, priceResponse.price);
      }
      
      return priceResponse;
    } catch (error) {
      logger.error(`Error fetching token price: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token balances for an account
   */
  public async getTokenBalancesForAccount(accountId: string, tokenIds?: string[]): Promise<TokenBalancesResponse> {
    try {
      const tokensToCheck = tokenIds || POPULAR_TOKENS;
      
      logger.info(`Getting balances for ${tokensToCheck.length} tokens for account ${accountId}`);
      
      const balancePromises = tokensToCheck.map(async (tokenId) => {
        try {
          const rawBalance = await this.apiClient.getTokenBalance(accountId, tokenId);
          const metadata = await this.getTokenMetadata(tokenId);
          
          // Convert raw balance to formatted balance
          const formattedBalance = this.formatBalance(rawBalance, metadata.decimals);
          
          // Get token price in USD if possible
          let usdValue = 0;
          try {
            const priceResponse = await this.getTokenPriceInTerms({
              token_id: tokenId,
              quote_id: 'wrap.near'
            });
            
            if (priceResponse.success && priceResponse.price !== undefined) {
              // Get NEAR price in USD
              const nearUsdResponse = await this.getTokenPriceInTerms({
                token_id: 'wrap.near',
                quote_id: 'usdt.tether-token.near'
              });
              
              if (nearUsdResponse.success && nearUsdResponse.price !== undefined) {
                usdValue = parseFloat(formattedBalance) * priceResponse.price * nearUsdResponse.price;
              }
            }
          } catch (priceError) {
            logger.warn(`Error getting USD value for ${tokenId}: ${priceError}`);
          }
          
          const balance: TokenBalance = {
            token_id: tokenId,
            balance: rawBalance,
            formatted_amount: formattedBalance,
            usd_value: usdValue.toString(),
            metadata
          };
          
          return balance;
        } catch (error) {
          logger.error(`Error getting balance for ${tokenId}: ${error}`);
          return null;
        }
      });
      
      const balances = await Promise.all(balancePromises);
      const validBalances = balances.filter(Boolean) as TokenBalance[];
      
      logger.success(`Retrieved ${validBalances.length} token balances for ${accountId}`);
      
      return {
        success: true,
        account_id: accountId,
        balances: validBalances
      };
    } catch (error) {
      logger.error(`Error fetching token balances: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format a token balance with metadata
   */
  public formatTokenBalance(tokenId: string, balance: string, metadata: TokenMetadata): TokenBalance {
    const formattedAmount = this.formatBalance(balance, metadata.decimals);
    return {
      token_id: tokenId,
      balance: balance,
      formatted_amount: formattedAmount,
      usd_value: '0', // This would need to be calculated with price data
      metadata: metadata
    };
  }
} 