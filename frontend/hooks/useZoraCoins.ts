import { useState } from 'react';
import { Address } from 'viem';

// API endpoints for Zora Coins
const API_BASE_URL = '/api/zora';

// API interfaces
interface CoinDetails {
  address: string;
  name: string;
  symbol: string;
  uri: string;
  ownerAddresses: string[];
  createdAt: string;
  // ... additional fields from API response
}

interface ProfileDetails {
  address: string;
  coinsOwned: number;
  coinsCreated: number;
  // ... additional fields from API response
}

interface BalanceDetails {
  address: string;
  coinBalances: {
    coinAddress: string;
    balance: string;
    coin: {
      name: string;
      symbol: string;
    };
  }[];
}

interface TrendingCoins {
  coins: CoinDetails[];
  cursor?: string;
}

// Hook for working with Zora Coins
export function useZoraCoins() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new coin
  const createCoin = async (coinData: {
    name: string;
    symbol: string;
    uri: string;
    payoutRecipient: Address;
    platformReferrer?: Address;
    owners?: Address[];
    initialPurchaseWei?: string;
    account: Address;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coinData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create coin');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Trade a coin
  const tradeCoin = async (tradeData: {
    coinContract: Address;
    amountIn: string;
    slippageBps?: number;
    platformReferrer?: Address;
    traderReferrer?: Address;
    account: Address;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to trade coin');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a coin's URI
  const updateCoinURI = async (updateData: {
    coinContract: Address;
    uri: string;
    account: Address;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/update-uri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update coin URI');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get details for a specific coin
  const getCoinDetails = async (address: Address): Promise<CoinDetails> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/coin/${address}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get coin details');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get profile info
  const getProfileInfo = async (address: Address): Promise<ProfileDetails> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${address}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get profile info');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get profile balances
  const getProfileBalances = async (address: Address): Promise<BalanceDetails> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile-balances/${address}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get profile balances');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get trending coins
  const getTrendingCoins = async (timeframe: 'day' | 'week' | 'month', limit = 10, cursor?: string): Promise<TrendingCoins> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_BASE_URL}/trending/${timeframe}?limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get trending coins');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCoin,
    tradeCoin,
    updateCoinURI,
    getCoinDetails,
    getProfileInfo,
    getProfileBalances,
    getTrendingCoins,
  };
}