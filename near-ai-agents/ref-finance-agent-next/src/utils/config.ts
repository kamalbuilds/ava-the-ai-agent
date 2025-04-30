/**
 * REF Finance Configuration
 */

/**
 * Network Configuration
 */
export interface NetworkConfig {
  networkId: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  refFinanceContract: string;
  wrapNearContract: string;
  refApiBaseUrl: string;
}

/**
 * Mainnet Configuration
 */
export const MAINNET_CONFIG: NetworkConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.near.org',
  helperUrl: 'https://helper.mainnet.near.org',
  explorerUrl: 'https://explorer.near.org',
  refFinanceContract: 'v2.ref-finance.near',
  wrapNearContract: 'wrap.near',
  refApiBaseUrl: 'https://api.ref.finance'
};

/**
 * Testnet Configuration
 */
export const TESTNET_CONFIG: NetworkConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
  refFinanceContract: 'ref-finance-101.testnet',
  wrapNearContract: 'wrap.testnet',
  refApiBaseUrl: 'https://testnet-api.ref.finance'
};

/**
 * Constants for REF Finance interactions
 */
export const REF_CONSTANTS = {
  // Gas limits
  SWAP_GAS: '200000000000000', // 200 TGas
  STORAGE_GAS: '30000000000000', // 30 TGas
  
  // Fee settings
  MIN_SLIPPAGE: 0.1, // 0.1%
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_SLIPPAGE: 10, // 10%
  
  // Cache settings
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Default referral
  REFERRAL_ID: 'ava.near',
  
  // Storage settings
  STORAGE_DEPOSIT_AMOUNT: '0.1' // 0.1 NEAR
};

/**
 * Get network configuration based on environment
 */
export function getNetworkConfig(networkId: string = 'mainnet'): NetworkConfig {
  return networkId === 'testnet' ? TESTNET_CONFIG : MAINNET_CONFIG;
}

/**
 * Get the current network configuration from environment or default to mainnet
 */
export function getCurrentNetworkConfig(): NetworkConfig {
  const networkId = process.env.NEXT_PUBLIC_NETWORK_ID || 'mainnet';
  return getNetworkConfig(networkId);
} 