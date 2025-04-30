/**
 * Token metadata interface
 * Represents the metadata for a token on the NEAR blockchain
 */
export interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
  reference?: string;
  reference_hash?: string;
  spec?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
  formattedBalance?: string;
}

/**
 * Account balances for multiple tokens
 */
export interface AccountBalances {
  [tokenId: string]: TokenBalance;
}

/**
 * Response from the API when fetching token metadata
 */
export interface GetTokenMetadataResponse {
  [tokenId: string]: TokenMetadata;
}

/**
 * Parameters for token swaps
 */
export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut?: string;
  useSmartRouting?: boolean;
}

/**
 * Known token types
 */
export enum TokenType {
  NEAR = 'NEAR',
  FT = 'FT',
  NFT = 'NFT'
}

/**
 * Special token IDs
 */
export const SPECIAL_TOKENS = {
  NEAR: 'NEAR',
  WNEAR: 'wrap.near'
};

/**
 * Token price parameters
 */
export interface TokenPriceParams {
  token_id: string;
  quote_id?: string;
}

/**
 * Token price response
 */
export interface TokenPriceResponse {
  success: boolean;
  price?: number;
  quote_token?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Token balances response
 */
export interface TokenBalancesResponse {
  success: boolean;
  balances?: TokenBalance[];
  totalUsdValue?: number;
  error?: string;
} 