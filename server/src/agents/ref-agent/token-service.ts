import { RefApiClient } from './api-client';
import { 
  TokenBalance, 
  TokenBalancesResponse, 
  TokenMetadata,
  TokenPriceParams,
  TokenPriceResponse
} from './types';
import { BigNumber } from 'bignumber.js';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing tokens in Ref Finance
 */
@Injectable()
export class RefTokenService {
  private apiClient: RefApiClient;
  private tokenMetadataCache: Map<string, TokenMetadata> = new Map();
  private tokenPriceCache: Map<string, { price: number, timestamp: number }> = new Map();
  private PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private tokenIds: string[] = [
    'wrap.near',
    'usdc.tether-token.near',
    'usdt.tether-token.near',
    'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near'
  ];

  constructor(
    private readonly apiClient: RefApiClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private config: ConfigService
  ) {}

  /**
   * Get token metadata
   */
  public async getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
    // Check cache first
    if (this.tokenMetadataCache.has(tokenId)) {
      return this.tokenMetadataCache.get(tokenId)!;
    }

    try {
      const metadata = await this.apiClient.getTokenMetadata(tokenId);
      this.tokenMetadataCache.set(tokenId, metadata);
      return metadata;
    } catch (error) {
      console.error(`[RefTokenService] Error getting token metadata for ${tokenId}: ${error}`);
      // Return a default metadata if token not found
      const defaultMetadata: TokenMetadata = {
        id: tokenId,
        name: tokenId,
        symbol: tokenId.split('.')[0].toUpperCase(),
        decimals: 18
      };
      return defaultMetadata;
    }
  }

  /**
   * Get token price in terms of another token
   */
  public async getTokenPrice(params: TokenPriceParams): Promise<TokenPriceResponse> {
    try {
      const cacheKey = `price:${params.token_id}:${params.quote_id || 'USD'}`;
      const cachedPrice = await this.cacheManager.get<TokenPriceResponse>(cacheKey);
      
      if (cachedPrice) {
        return cachedPrice;
      }

      const url = `${this.config.REF_API_URL}/token-price/${params.token_id}`;
      const response = await axios.get(url);
      const priceResponse: TokenPriceResponse = response.data;
      
      if (priceResponse.success && priceResponse.price !== undefined) {
        await this.cacheManager.set(cacheKey, priceResponse, 60 * 5); // Cache for 5 minutes
      }
      
      return priceResponse;
    } catch (error) {
      console.error(`Error fetching token price: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token balances for an account
   */
  public async getTokenBalances(accountId: string): Promise<TokenBalancesResponse> {
    try {
      const balancePromises = this.tokenIds.map(async (tokenId) => {
        try {
          const rawBalance = await this.apiClient.getTokenBalance(accountId, tokenId);
          const metadata = await this.getTokenMetadata(tokenId);
          
          // Convert raw balance to formatted balance
          const formattedBalance = this.formatBalance(rawBalance, metadata.decimals);
          
          // Get token price in USD if possible
          let usdValue = 0;
          try {
            const priceResponse = await this.getTokenPrice({
              token_id: tokenId,
              quote_id: 'wrap.near'
            });
            
            if (priceResponse.success && priceResponse.price !== undefined) {
              // Get NEAR price in USD
              const nearUsdResponse = await this.getTokenPrice({
                token_id: 'wrap.near',
                quote_id: 'usdt.tether-token.near'
              });
              
              if (nearUsdResponse.success && nearUsdResponse.price !== undefined) {
                usdValue = parseFloat(formattedBalance) * priceResponse.price * nearUsdResponse.price;
              }
            }
          } catch (priceError) {
            console.warn(`[RefTokenService] Error getting USD value for ${tokenId}: ${priceError}`);
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
          console.error(`[RefTokenService] Error getting balance for ${tokenId}: ${error}`);
          return null;
        }
      });
      
      const balances = await Promise.all(balancePromises);
      const validBalances = balances.filter(Boolean) as TokenBalance[];
      
      return {
        success: true,
        account_id: accountId,
        balances: validBalances
      };
    } catch (error) {
      console.error(`Error fetching token balances: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format a raw balance with the appropriate number of decimals
   */
  private formatBalance(rawBalance: string, decimals: number): string {
    if (!rawBalance) return '0';
    return new BigNumber(rawBalance).shiftedBy(-decimals).toString();
  }

  formatTokenBalance(tokenId: string, balance: string, metadata: TokenMetadata): TokenBalance {
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
