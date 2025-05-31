import { connect, keyStores, utils, WalletConnection, Near } from 'near-api-js';
import { providers } from 'near-api-js';
import BN from 'bn.js';

// NEAR AI Agent Configuration
interface NearAgentConfig {
  networkId: 'mainnet' | 'testnet';
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  keyStore?: keyStores.KeyStore;
}

// Transaction Types
interface TransferTransaction {
  receiverId: string;
  amount: string;
  memo?: string;
}

interface StakeTransaction {
  validatorId: string;
  amount: string;
}

interface DeFiTransaction {
  contractId: string;
  methodName: string;
  args: any;
  gas?: string;
  deposit?: string;
}

// Portfolio Data Types
interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  contractId?: string;
}

interface PortfolioData {
  nearBalance: string;
  totalValue: number;
  tokens: TokenBalance[];
  stakingRewards: string;
  defiPositions: DeFiPosition[];
}

interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'staking' | 'farming';
  asset: string;
  amount: string;
  apy: number;
  value: number;
}

// AI Agent Types
interface AIRecommendation {
  type: 'stake' | 'unstake' | 'swap' | 'farm' | 'lend';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  action: any;
}

interface MarketData {
  nearPrice: number;
  gasPrice: string;
  stakingAPY: number;
  defiOpportunities: DeFiOpportunity[];
}

interface DeFiOpportunity {
  protocol: string;
  asset: string;
  apy: number;
  tvl: number;
  riskScore: number;
}

// Main NEAR Agent Class
export class NearAIAgent {
  private near: Near | null = null;
  private wallet: WalletConnection | null = null;
  private account: any = null;
  private config: NearAgentConfig;

  constructor(networkId: 'mainnet' | 'testnet' = 'testnet') {
    this.config = this.getNetworkConfig(networkId);
  }

  private getNetworkConfig(networkId: 'mainnet' | 'testnet'): NearAgentConfig {
    if (networkId === 'mainnet') {
      return {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        keyStore: new keyStores.BrowserLocalStorageKeyStore()
      };
    } else {
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        keyStore: new keyStores.BrowserLocalStorageKeyStore()
      };
    }
  }

  // Initialize NEAR connection
  async initialize(): Promise<void> {
    try {
      this.near = await connect(this.config);
      this.wallet = new WalletConnection(this.near, 'ava-near-ai-agent');
      
      if (this.wallet.isSignedIn()) {
        this.account = this.wallet.account();
      }
    } catch (error) {
      console.error('Failed to initialize NEAR connection:', error);
      throw error;
    }
  }

  // Wallet Management
  async connectWallet(): Promise<void> {
    if (!this.wallet) {
      throw new Error('NEAR not initialized');
    }
    
    await this.wallet.requestSignIn({
      contractId: "",
      methodNames: [],
      keyType: "ed25519"
    });
  }

  async disconnectWallet(): Promise<void> {
    if (this.wallet) {
      this.wallet.signOut();
      this.account = null;
    }
  }

  isConnected(): boolean {
    return this.wallet?.isSignedIn() || false;
  }

  getAccountId(): string | null {
    return this.wallet?.getAccountId() || null;
  }

  // Portfolio Management
  async getPortfolioData(): Promise<PortfolioData> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const accountId = this.account.accountId;
      
      // Get NEAR balance
      const accountState = await this.account.state();
      const nearBalance = utils.format.formatNearAmount(accountState.amount);
      
      // Get token balances (for production, integrate with indexer)
      const tokens = await this.getTokenBalances(accountId);
      
      // Get staking rewards
      const stakingRewards = await this.getStakingRewards(accountId);
      
      // Get DeFi positions
      const defiPositions = await this.getDeFiPositions(accountId);
      
      // Calculate total value
      const nearPrice = await this.getNearPrice();
      const totalValue = parseFloat(nearBalance) * nearPrice + 
                        tokens.reduce((sum, token) => sum + token.value, 0) +
                        defiPositions.reduce((sum, pos) => sum + pos.value, 0);

      return {
        nearBalance,
        totalValue,
        tokens,
        stakingRewards,
        defiPositions
      };
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      throw error;
    }
  }

  private async getTokenBalances(accountId: string): Promise<TokenBalance[]> {
    // In production, this would call NEAR indexer or token contracts
    // For now, return mock data with real structure
    return [
      {
        symbol: 'USDC.e',
        balance: '1000.50',
        value: 1000.50,
        contractId: 'a0b86991c431e6fa4e24dd3ca6c0b6ccb6bdcc'
      },
      {
        symbol: 'wNEAR',
        balance: '150.25',
        value: 420.70,
        contractId: 'wrap.near'
      }
    ];
  }

  private async getStakingRewards(accountId: string): Promise<string> {
    // Query staking contracts for rewards
    try {
      // This would integrate with actual staking pools
      return '12.5'; // Mock rewards
    } catch (error) {
      console.error('Failed to get staking rewards:', error);
      return '0';
    }
  }

  private async getDeFiPositions(accountId: string): Promise<DeFiPosition[]> {
    // Query DeFi protocols like Ref Finance, Burrow, etc.
    return [
      {
        protocol: 'Ref Finance',
        type: 'farming',
        asset: 'NEAR-USDC',
        amount: '500.0',
        apy: 18.5,
        value: 1400.0
      },
      {
        protocol: 'Burrow',
        type: 'lending',
        asset: 'NEAR',
        amount: '200.0',
        apy: 8.2,
        value: 560.0
      }
    ];
  }

  // Transaction Building
  async buildTransferTransaction(params: TransferTransaction): Promise<any> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const amount = utils.format.parseNearAmount(params.amount);
      if (!amount) {
        throw new Error('Invalid amount');
      }

      const actions = [{
        type: 'Transfer',
        params: {
          deposit: amount
        }
      }];

      return {
        receiverId: params.receiverId,
        actions,
        memo: params.memo
      };
    } catch (error) {
      console.error('Failed to build transfer transaction:', error);
      throw error;
    }
  }

  async executeTransferTransaction(params: TransferTransaction): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const amount = utils.format.parseNearAmount(params.amount);
      if (!amount) {
        throw new Error('Invalid amount');
      }

      const result = await this.account.sendMoney(params.receiverId, amount);
      return result.transaction.hash;
    } catch (error) {
      console.error('Failed to execute transfer:', error);
      throw error;
    }
  }

  async buildStakeTransaction(params: StakeTransaction): Promise<any> {
    try {
      const amount = utils.format.parseNearAmount(params.amount);
      if (!amount) {
        throw new Error('Invalid amount');
      }

      return {
        receiverId: params.validatorId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'deposit_and_stake',
            args: {},
            gas: '30000000000000',
            deposit: amount
          }
        }]
      };
    } catch (error) {
      console.error('Failed to build stake transaction:', error);
      throw error;
    }
  }

  async executeStakeTransaction(params: StakeTransaction): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const amount = utils.format.parseNearAmount(params.amount);
      if (!amount) {
        throw new Error('Invalid amount');
      }

      const result = await this.account.functionCall({
        contractId: params.validatorId,
        methodName: 'deposit_and_stake',
        args: {},
        gas: new BN('30000000000000'),
        attachedDeposit: new BN(amount)
      });

      return result.transaction.hash;
    } catch (error) {
      console.error('Failed to execute stake transaction:', error);
      throw error;
    }
  }

  // DeFi Operations
  async buildDeFiTransaction(params: DeFiTransaction): Promise<any> {
    try {
      const gas = params.gas || '30000000000000';
      const deposit = params.deposit ? utils.format.parseNearAmount(params.deposit) : '0';

      return {
        receiverId: params.contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: params.methodName,
            args: params.args,
            gas,
            deposit
          }
        }]
      };
    } catch (error) {
      console.error('Failed to build DeFi transaction:', error);
      throw error;
    }
  }

  async executeDeFiTransaction(params: DeFiTransaction): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const gas = new BN(params.gas || '30000000000000');
      const deposit = new BN(params.deposit ? utils.format.parseNearAmount(params.deposit) || '0' : '0');

      const result = await this.account.functionCall({
        contractId: params.contractId,
        methodName: params.methodName,
        args: params.args,
        gas,
        attachedDeposit: deposit
      });

      return result.transaction.hash;
    } catch (error) {
      console.error('Failed to execute DeFi transaction:', error);
      throw error;
    }
  }

  // Market Data
  async getMarketData(): Promise<MarketData> {
    try {
      const nearPrice = await this.getNearPrice();
      const gasPrice = await this.getGasPrice();
      const stakingAPY = await this.getStakingAPY();
      const defiOpportunities = await this.getDeFiOpportunities();

      return {
        nearPrice,
        gasPrice,
        stakingAPY,
        defiOpportunities
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  private async getNearPrice(): Promise<number> {
    try {
      // In production, integrate with price feeds like CoinGecko or Ref Finance
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd');
      const data = await response.json();
      return data.near.usd;
    } catch (error) {
      console.error('Failed to fetch NEAR price:', error);
      return 2.80; // Fallback price
    }
  }

  private async getGasPrice(): Promise<string> {
    try {
      if (!this.near) return '100000000';
      
      const provider = this.near.connection.provider as providers.JsonRpcProvider;
      const result = await provider.query({
        request_type: 'view_access_key',
        finality: 'final',
        account_id: 'system',
        public_key: ''
      });
      
      return '100000000'; // 0.0001 NEAR in yoctoNEAR
    } catch (error) {
      console.error('Failed to fetch gas price:', error);
      return '100000000';
    }
  }

  private async getStakingAPY(): Promise<number> {
    // In production, query validator contracts for actual APY
    return 10.5;
  }

  private async getDeFiOpportunities(): Promise<DeFiOpportunity[]> {
    // In production, query DeFi protocols for current yields
    return [
      {
        protocol: 'Ref Finance',
        asset: 'NEAR-USDC',
        apy: 18.7,
        tvl: 12500000,
        riskScore: 3
      },
      {
        protocol: 'Burrow',
        asset: 'NEAR',
        apy: 8.2,
        tvl: 45000000,
        riskScore: 2
      },
      {
        protocol: 'Meta Pool',
        asset: 'stNEAR',
        apy: 10.8,
        tvl: 78000000,
        riskScore: 1
      }
    ];
  }

  // AI Agent Functions
  async getAIRecommendations(portfolioData: PortfolioData): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const marketData = await this.getMarketData();

    // Analyze portfolio and market conditions
    const nearBalance = parseFloat(portfolioData.nearBalance);
    const totalValue = portfolioData.totalValue;

    // Staking recommendation
    if (nearBalance > 100) {
      recommendations.push({
        type: 'stake',
        priority: 'high',
        description: `Stake ${Math.floor(nearBalance * 0.7)} NEAR for ${marketData.stakingAPY}% APY`,
        expectedReturn: (nearBalance * 0.7 * marketData.stakingAPY) / 100,
        riskLevel: 'low',
        action: {
          validatorId: 'aurora.pool.near',
          amount: (nearBalance * 0.7).toString()
        }
      });
    }

    // DeFi farming recommendation
    const highYieldOpportunity = marketData.defiOpportunities
      .filter(op => op.riskScore <= 3)
      .sort((a, b) => b.apy - a.apy)[0];

    if (highYieldOpportunity && totalValue > 1000) {
      recommendations.push({
        type: 'farm',
        priority: 'medium',
        description: `Farm ${highYieldOpportunity.asset} on ${highYieldOpportunity.protocol} for ${highYieldOpportunity.apy}% APY`,
        expectedReturn: (totalValue * 0.2 * highYieldOpportunity.apy) / 100,
        riskLevel: 'medium',
        action: {
          protocol: highYieldOpportunity.protocol,
          asset: highYieldOpportunity.asset,
          amount: (totalValue * 0.2).toString()
        }
      });
    }

    // Diversification recommendation
    const nearPercentage = (nearBalance * marketData.nearPrice) / totalValue * 100;
    if (nearPercentage > 80) {
      recommendations.push({
        type: 'swap',
        priority: 'medium',
        description: 'Consider diversifying into USDC or other stable assets',
        expectedReturn: 0,
        riskLevel: 'low',
        action: {
          fromToken: 'NEAR',
          toToken: 'USDC',
          amount: (nearBalance * 0.3).toString()
        }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Multi-chain Address Generation (using NEAR MPC)
  async generateMultiChainAddresses(derivationPath: string): Promise<{
    nearAddress: string;
    ethereumAddress: string;
    bitcoinAddress: string;
  }> {
    try {
      if (!this.account) {
        throw new Error('Wallet not connected');
      }

      // In production, this would call the MPC contract
      const nearAddress = this.account.accountId;
      
      // For demo purposes, generate deterministic addresses
      // In production, use actual MPC derivation
      const hash = await this.generateAddressHash(derivationPath);
      
      return {
        nearAddress,
        ethereumAddress: `0x${hash.substring(0, 40)}`,
        bitcoinAddress: `bc1q${hash.substring(40, 80)}`
      };
    } catch (error) {
      console.error('Failed to generate multi-chain addresses:', error);
      throw error;
    }
  }

  private async generateAddressHash(derivationPath: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(derivationPath + this.getAccountId());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Transaction History
  async getTransactionHistory(limit: number = 50): Promise<any[]> {
    try {
      if (!this.account) {
        throw new Error('Wallet not connected');
      }

      // In production, query NEAR indexer for transaction history
      // For now, return mock data
      return [
        {
          hash: '0x123abc...',
          blockHeight: 123456789,
          timestamp: new Date().toISOString(),
          type: 'transfer',
          amount: '10.5',
          from: this.account.accountId,
          to: 'alice.near',
          status: 'success'
        }
      ];
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw error;
    }
  }

  // Utility Functions
  formatNearAmount(amount: string): string {
    return utils.format.formatNearAmount(amount);
  }

  parseNearAmount(amount: string): string | null {
    return utils.format.parseNearAmount(amount);
  }

  async estimateGas(receiverId: string, methodName: string, args: any): Promise<string> {
    try {
      // In production, estimate actual gas costs
      return '30000000000000'; // 30 TGas
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '30000000000000';
    }
  }
}

// Export utility functions
export const nearUtils = {
  formatNearAmount: utils.format.formatNearAmount,
  parseNearAmount: utils.format.parseNearAmount,
  
  formatTokenAmount: (amount: string, decimals: number = 18): string => {
    const bn = new BN(amount);
    const divisor = new BN(10).pow(new BN(decimals));
    const quotient = bn.div(divisor);
    const remainder = bn.mod(divisor);
    
    if (remainder.isZero()) {
      return quotient.toString();
    }
    
    const fractional = remainder.toString().padStart(decimals, '0');
    return `${quotient.toString()}.${fractional.replace(/0+$/, '')}`;
  },

  validateNearAddress: (address: string): boolean => {
    // Basic NEAR address validation
    const nearAddressRegex = /^[a-z0-9_-]+\.near$|^[a-f0-9]{64}$/;
    return nearAddressRegex.test(address);
  },

  validateAmount: (amount: string): boolean => {
    try {
      const parsed = utils.format.parseNearAmount(amount);
      return parsed !== null && new BN(parsed).gt(new BN(0));
    } catch {
      return false;
    }
  }
};

export default NearAIAgent; 