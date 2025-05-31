"use client";
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import NearAIAgent, { nearUtils } from '@/lib/near-agent';

// Types
interface Transaction {
  id: string;
  type: 'transfer' | 'stake' | 'unstake' | 'swap' | 'defi';
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
  amount: string;
  timestamp: Date;
  details: any;
}

interface Portfolio {
  totalValue: number;
  nearBalance: string;
  tokens: Array<{
    symbol: string;
    balance: string;
    value: number;
    contractId?: string;
  }>;
  stakingRewards: string;
  defiPositions: Array<{
    protocol: string;
    type: 'lending' | 'staking' | 'farming';
    asset: string;
    amount: string;
    apy: number;
    value: number;
  }>;
}

interface AIRecommendation {
  type: 'stake' | 'unstake' | 'swap' | 'farm' | 'lend';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  action: any;
}

interface NearAgentState {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  accountId: string | null;
  networkId: 'mainnet' | 'testnet';
  
  // Portfolio State
  portfolio: Portfolio | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  
  // Transaction State
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  transactionLoading: boolean;
  
  // AI Agent State
  aiRecommendations: AIRecommendation[];
  aiProcessing: boolean;
  agentMode: 'manual' | 'semi-auto' | 'auto';
  
  // Market Data
  nearPrice: number;
  gasPrice: string;
  validators: any[];
  supportedTokens: any[];
  defiProtocols: any[];
  
  // UI State
  selectedTab: string;
  chatMessages: Array<{
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
  }>;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

type NearAgentAction =
  | { type: 'SET_CONNECTED'; payload: { isConnected: boolean; accountId: string | null } }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_NETWORK'; payload: 'mainnet' | 'testnet' }
  | { type: 'SET_PORTFOLIO'; payload: Portfolio }
  | { type: 'SET_PORTFOLIO_LOADING'; payload: boolean }
  | { type: 'SET_PORTFOLIO_ERROR'; payload: string | null }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'SET_TRANSACTION_LOADING'; payload: boolean }
  | { type: 'SET_AI_RECOMMENDATIONS'; payload: AIRecommendation[] }
  | { type: 'SET_AI_PROCESSING'; payload: boolean }
  | { type: 'SET_AGENT_MODE'; payload: 'manual' | 'semi-auto' | 'auto' }
  | { type: 'SET_MARKET_DATA'; payload: { nearPrice: number; gasPrice: string } }
  | { type: 'SET_VALIDATORS'; payload: any[] }
  | { type: 'SET_TOKENS'; payload: any[] }
  | { type: 'SET_DEFI_PROTOCOLS'; payload: any[] }
  | { type: 'SET_SELECTED_TAB'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { role: 'user' | 'agent'; content: string } }
  | { type: 'ADD_NOTIFICATION'; payload: { type: 'success' | 'error' | 'warning' | 'info'; message: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Initial State
const initialState: NearAgentState = {
  isConnected: false,
  isConnecting: false,
  accountId: null,
  networkId: 'testnet',
  
  portfolio: null,
  portfolioLoading: false,
  portfolioError: null,
  
  transactions: [],
  pendingTransactions: [],
  transactionLoading: false,
  
  aiRecommendations: [],
  aiProcessing: false,
  agentMode: 'manual',
  
  nearPrice: 0,
  gasPrice: '0',
  validators: [],
  supportedTokens: [],
  defiProtocols: [],
  
  selectedTab: 'overview',
  chatMessages: [],
  notifications: []
};

// Reducer
function nearAgentReducer(state: NearAgentState, action: NearAgentAction): NearAgentState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        accountId: action.payload.accountId,
        isConnecting: false
      };
    
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    
    case 'SET_NETWORK':
      return { ...state, networkId: action.payload };
    
    case 'SET_PORTFOLIO':
      return {
        ...state,
        portfolio: action.payload,
        portfolioLoading: false,
        portfolioError: null
      };
    
    case 'SET_PORTFOLIO_LOADING':
      return { ...state, portfolioLoading: action.payload };
    
    case 'SET_PORTFOLIO_ERROR':
      return {
        ...state,
        portfolioError: action.payload,
        portfolioLoading: false
      };
    
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        pendingTransactions: action.payload.status === 'pending' 
          ? [action.payload, ...state.pendingTransactions]
          : state.pendingTransactions
      };
    
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id ? { ...tx, ...action.payload.updates } : tx
        ),
        pendingTransactions: state.pendingTransactions.filter(tx =>
          tx.id !== action.payload.id || action.payload.updates.status === 'pending'
        )
      };
    
    case 'SET_TRANSACTION_LOADING':
      return { ...state, transactionLoading: action.payload };
    
    case 'SET_AI_RECOMMENDATIONS':
      return { ...state, aiRecommendations: action.payload };
    
    case 'SET_AI_PROCESSING':
      return { ...state, aiProcessing: action.payload };
    
    case 'SET_AGENT_MODE':
      return { ...state, agentMode: action.payload };
    
    case 'SET_MARKET_DATA':
      return {
        ...state,
        nearPrice: action.payload.nearPrice,
        gasPrice: action.payload.gasPrice
      };
    
    case 'SET_VALIDATORS':
      return { ...state, validators: action.payload };
    
    case 'SET_TOKENS':
      return { ...state, supportedTokens: action.payload };
    
    case 'SET_DEFI_PROTOCOLS':
      return { ...state, defiProtocols: action.payload };
    
    case 'SET_SELECTED_TAB':
      return { ...state, selectedTab: action.payload };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          {
            ...action.payload,
            timestamp: new Date()
          }
        ]
      };
    
    case 'ADD_NOTIFICATION':
      const notificationId = Date.now().toString();
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: notificationId,
            ...action.payload,
            timestamp: new Date()
          }
        ]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    default:
      return state;
  }
}

// Context
interface NearAgentContextType {
  state: NearAgentState;
  dispatch: React.Dispatch<NearAgentAction>;
  agent: NearAIAgent | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  buildTransaction: (params: any) => Promise<any>;
  executeTransaction: (transaction: any) => Promise<string>;
  processAICommand: (command: string) => Promise<string>;
  getAIRecommendations: () => Promise<void>;
  switchNetwork: (networkId: 'mainnet' | 'testnet') => Promise<void>;
  
  // Utilities
  formatNearAmount: (amount: string) => string;
  validateAddress: (address: string) => boolean;
  estimateGas: (transaction: any) => Promise<string>;
}

const NearAgentContext = createContext<NearAgentContextType | undefined>(undefined);

// Provider Component
interface NearAgentProviderProps {
  children: ReactNode;
  defaultNetwork?: 'mainnet' | 'testnet';
}

export function NearAgentProvider({ children, defaultNetwork = 'testnet' }: NearAgentProviderProps) {
  const [state, dispatch] = useReducer(nearAgentReducer, {
    ...initialState,
    networkId: defaultNetwork
  });
  
  const [agent, setAgent] = React.useState<NearAIAgent | null>(null);

  // Initialize agent
  useEffect(() => {
    const initAgent = async () => {
      try {
        const newAgent = new NearAIAgent(state.networkId);
        await newAgent.initialize();
        setAgent(newAgent);
        
        // Check if already connected
        if (newAgent.isConnected()) {
          dispatch({
            type: 'SET_CONNECTED',
            payload: {
              isConnected: true,
              accountId: newAgent.getAccountId()
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize NEAR agent:', error);
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'error',
            message: 'Failed to initialize NEAR connection'
          }
        });
      }
    };

    initAgent();
  }, [state.networkId]);

  // Load initial data
  useEffect(() => {
    if (state.isConnected && agent) {
      refreshPortfolio();
      loadMarketData();
      loadValidators();
      loadTokens();
      loadDeFiProtocols();
    }
  }, [state.isConnected, agent]);

  // Actions
  const connectWallet = async () => {
    if (!agent) throw new Error('Agent not initialized');
    
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      await agent.connectWallet();
      
      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          isConnected: true,
          accountId: agent.getAccountId()
        }
      });
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'success',
          message: 'Wallet connected successfully'
        }
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      dispatch({ type: 'SET_CONNECTING', payload: false });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: 'Failed to connect wallet'
        }
      });
    }
  };

  const disconnectWallet = async () => {
    if (!agent) return;
    
    try {
      await agent.disconnectWallet();
      dispatch({
        type: 'SET_CONNECTED',
        payload: { isConnected: false, accountId: null }
      });
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'success',
          message: 'Wallet disconnected'
        }
      });
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  const refreshPortfolio = async () => {
    if (!agent || !state.isConnected) return;
    
    try {
      dispatch({ type: 'SET_PORTFOLIO_LOADING', payload: true });
      const portfolioData = await agent.getPortfolioData();
      
      dispatch({ type: 'SET_PORTFOLIO', payload: portfolioData });
    } catch (error) {
      console.error('Portfolio refresh failed:', error);
      dispatch({
        type: 'SET_PORTFOLIO_ERROR',
        payload: 'Failed to load portfolio data'
      });
    }
  };

  const buildTransaction = async (params: any) => {
    if (!agent) throw new Error('Agent not initialized');
    
    try {
      dispatch({ type: 'SET_TRANSACTION_LOADING', payload: true });
      
      let transaction;
      switch (params.type) {
        case 'transfer':
          transaction = await agent.buildTransferTransaction(params);
          break;
        case 'stake':
          transaction = await agent.buildStakeTransaction(params);
          break;
        case 'defi':
          transaction = await agent.buildDeFiTransaction(params);
          break;
        default:
          throw new Error(`Unsupported transaction type: ${params.type}`);
      }
      
      dispatch({ type: 'SET_TRANSACTION_LOADING', payload: false });
      return transaction;
    } catch (error) {
      dispatch({ type: 'SET_TRANSACTION_LOADING', payload: false });
      throw error;
    }
  };

  const executeTransaction = async (transaction: any): Promise<string> => {
    if (!agent) throw new Error('Agent not initialized');
    
    try {
      // Add transaction to pending
      const txRecord: Transaction = {
        id: Date.now().toString(),
        type: transaction.type || 'transfer',
        status: 'pending',
        amount: transaction.amount || '0',
        timestamp: new Date(),
        details: transaction
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: txRecord });
      
      // Execute based on type
      let hash: string;
      switch (transaction.type) {
        case 'transfer':
          hash = await agent.executeTransferTransaction(transaction);
          break;
        case 'stake':
          hash = await agent.executeStakeTransaction(transaction);
          break;
        case 'defi':
          hash = await agent.executeDeFiTransaction(transaction);
          break;
        default:
          throw new Error(`Unsupported transaction type: ${transaction.type}`);
      }
      
      // Update transaction with hash
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          id: txRecord.id,
          updates: { hash, status: 'completed' }
        }
      });
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'success',
          message: 'Transaction executed successfully'
        }
      });
      
      // Refresh portfolio after successful transaction
      setTimeout(() => refreshPortfolio(), 2000);
      
      return hash;
    } catch (error) {
      console.error('Transaction execution failed:', error);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: 'Transaction failed'
        }
      });
      throw error;
    }
  };

  const processAICommand = async (command: string): Promise<string> => {
    if (!agent) throw new Error('Agent not initialized');
    
    try {
      dispatch({ type: 'SET_AI_PROCESSING', payload: true });
      
      // Add user message
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'user', content: command }
      });
      
      // Simulate AI processing (in production, integrate with actual AI service)
      const response = await simulateAIResponse(command, state.portfolio);
      
      // Add agent response
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'agent', content: response }
      });
      
      dispatch({ type: 'SET_AI_PROCESSING', payload: false });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_AI_PROCESSING', payload: false });
      throw error;
    }
  };

  const getAIRecommendations = async () => {
    if (!agent || !state.portfolio) return;
    
    try {
      const recommendations = await agent.getAIRecommendations(state.portfolio);
      dispatch({ type: 'SET_AI_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
    }
  };

  const switchNetwork = async (networkId: 'mainnet' | 'testnet') => {
    try {
      dispatch({ type: 'SET_NETWORK', payload: networkId });
      
      // Reinitialize agent with new network
      const newAgent = new NearAIAgent(networkId);
      await newAgent.initialize();
      setAgent(newAgent);
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'info',
          message: `Switched to ${networkId}`
        }
      });
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  // Helper functions
  const loadMarketData = async () => {
    try {
      if (!agent) return;
      const marketData = await agent.getMarketData();
      dispatch({
        type: 'SET_MARKET_DATA',
        payload: {
          nearPrice: marketData.nearPrice,
          gasPrice: marketData.gasPrice
        }
      });
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const loadValidators = async () => {
    try {
      const response = await fetch(`/api/near-agent/transactions?action=validators&networkId=${state.networkId}`);
      const data = await response.json();
      dispatch({ type: 'SET_VALIDATORS', payload: data.validators || [] });
    } catch (error) {
      console.error('Failed to load validators:', error);
    }
  };

  const loadTokens = async () => {
    try {
      const response = await fetch(`/api/near-agent/transactions?action=tokens&networkId=${state.networkId}`);
      const data = await response.json();
      dispatch({ type: 'SET_TOKENS', payload: data.tokens || [] });
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };

  const loadDeFiProtocols = async () => {
    try {
      const response = await fetch(`/api/near-agent/transactions?action=defi-protocols&networkId=${state.networkId}`);
      const data = await response.json();
      dispatch({ type: 'SET_DEFI_PROTOCOLS', payload: data.protocols || [] });
    } catch (error) {
      console.error('Failed to load DeFi protocols:', error);
    }
  };

  // Utility functions
  const formatNearAmount = (amount: string): string => {
    return nearUtils.formatNearAmount(amount);
  };

  const validateAddress = (address: string): boolean => {
    return nearUtils.validateNearAddress(address);
  };

  const estimateGas = async (transaction: any): Promise<string> => {
    if (!agent) throw new Error('Agent not initialized');
    return agent.estimateGas(transaction.receiverId, transaction.methodName, transaction.args);
  };

  const contextValue: NearAgentContextType = {
    state,
    dispatch,
    agent,
    connectWallet,
    disconnectWallet,
    refreshPortfolio,
    buildTransaction,
    executeTransaction,
    processAICommand,
    getAIRecommendations,
    switchNetwork,
    formatNearAmount,
    validateAddress,
    estimateGas
  };

  return (
    <NearAgentContext.Provider value={contextValue}>
      {children}
    </NearAgentContext.Provider>
  );
}

// Hook
export function useNearAgent() {
  const context = useContext(NearAgentContext);
  if (context === undefined) {
    throw new Error('useNearAgent must be used within a NearAgentProvider');
  }
  return context;
}

// AI Response Simulator
async function simulateAIResponse(command: string, portfolio: Portfolio | null): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('balance') || lowerCommand.includes('portfolio')) {
        if (portfolio) {
          resolve(`Your current portfolio value is $${portfolio.totalValue.toFixed(2)} with ${portfolio.nearBalance} NEAR. You have ${portfolio.tokens.length} different tokens and ${portfolio.stakingRewards.length} staking positions.`);
        } else {
          resolve('Please connect your wallet to view portfolio information.');
        }
      } else if (lowerCommand.includes('stake') || lowerCommand.includes('staking')) {
        resolve('I can help you stake your NEAR tokens. Current staking APY ranges from 8-12%. Would you like me to show you available validators?');
      } else if (lowerCommand.includes('swap') || lowerCommand.includes('trade')) {
        resolve('I can help you swap tokens on Ref Finance. What tokens would you like to trade?');
      } else if (lowerCommand.includes('defi') || lowerCommand.includes('yield')) {
        resolve('Current DeFi opportunities include Ref Finance (18.7% APY), Burrow lending (8.2% APY), and Meta Pool staking (10.8% APY). Which interests you?');
      } else {
        resolve('I can help you with NEAR blockchain operations including transfers, staking, swaps, and DeFi activities. What would you like to do?');
      }
    }, 1500);
  });
}

export default NearAgentContext; 