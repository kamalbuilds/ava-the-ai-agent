import { useState, useEffect, useCallback } from 'react';
import NearIntegration, { MultiChainWallet, TransactionRequest, AIAgentResponse } from '@/lib/near-integration';

interface UseNearIntegrationState {
  nearAgent: NearIntegration | null;
  connected: boolean;
  initializing: boolean;
  wallet: MultiChainWallet | null;
  error: string | null;
}

interface UseNearIntegrationReturn extends UseNearIntegrationState {
  initialize: (networkId?: 'mainnet' | 'testnet') => Promise<boolean>;
  generateAddresses: (path: string) => Promise<MultiChainWallet | null>;
  buildTransaction: (request: TransactionRequest) => Promise<any>;
  executeTransaction: (transaction: any, chain: string) => Promise<AIAgentResponse>;
  getPortfolioBalance: () => Promise<Record<string, string> | null>;
  disconnect: () => void;
}

export const useNearIntegration = (): UseNearIntegrationReturn => {
  const [state, setState] = useState<UseNearIntegrationState>({
    nearAgent: null,
    connected: false,
    initializing: false,
    wallet: null,
    error: null
  });

  const initialize = useCallback(async (networkId: 'mainnet' | 'testnet' = 'testnet'): Promise<boolean> => {
    setState(prev => ({ ...prev, initializing: true, error: null }));

    try {
      const agent = new NearIntegration(networkId);
      const success = await agent.initialize();

      if (success) {
        setState(prev => ({
          ...prev,
          nearAgent: agent,
          connected: true,
          initializing: false
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          initializing: false,
          error: 'Failed to initialize NEAR connection'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        initializing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      return false;
    }
  }, []);

  const generateAddresses = useCallback(async (path: string): Promise<MultiChainWallet | null> => {
    if (!state.nearAgent) {
      setState(prev => ({ ...prev, error: 'NEAR agent not initialized' }));
      return null;
    }

    try {
      const wallet = await state.nearAgent.generateAddresses(path);
      setState(prev => ({ ...prev, wallet, error: null }));
      return wallet;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate addresses'
      }));
      return null;
    }
  }, [state.nearAgent]);

  const buildTransaction = useCallback(async (request: TransactionRequest): Promise<any> => {
    if (!state.nearAgent) {
      setState(prev => ({ ...prev, error: 'NEAR agent not initialized' }));
      return null;
    }

    try {
      const transaction = await state.nearAgent.buildTransaction(request);
      setState(prev => ({ ...prev, error: null }));
      return transaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to build transaction'
      }));
      return null;
    }
  }, [state.nearAgent]);

  const executeTransaction = useCallback(async (transaction: any, chain: string): Promise<AIAgentResponse> => {
    if (!state.nearAgent) {
      return {
        success: false,
        error: 'NEAR agent not initialized'
      };
    }

    try {
      const result = await state.nearAgent.executeTransaction(transaction, chain);
      if (result.success) {
        setState(prev => ({ ...prev, error: null }));
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Transaction failed' }));
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute transaction';
      setState(prev => ({ ...prev, error: errorMessage }));
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [state.nearAgent]);

  const getPortfolioBalance = useCallback(async (): Promise<Record<string, string> | null> => {
    if (!state.nearAgent || !state.wallet) {
      setState(prev => ({ ...prev, error: 'NEAR agent or wallet not available' }));
      return null;
    }

    try {
      const balances = await state.nearAgent.getPortfolioBalance(state.wallet);
      setState(prev => ({ ...prev, error: null }));
      return balances;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio balance'
      }));
      return null;
    }
  }, [state.nearAgent, state.wallet]);

  const disconnect = useCallback(() => {
    setState({
      nearAgent: null,
      connected: false,
      initializing: false,
      wallet: null,
      error: null
    });
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return {
    ...state,
    initialize,
    generateAddresses,
    buildTransaction,
    executeTransaction,
    getPortfolioBalance,
    disconnect
  };
};

export default useNearIntegration; 