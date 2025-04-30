import { 
  createCoin, 
  tradeCoin, 
  updateCoinURI, 
  getOnchainCoinDetails, 
  getCoin, 
  getCoins, 
  getProfile, 
  getProfileBalances, 
  getExplore,
  setApiKey,
} from '@zoralabs/coins-sdk';
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { env } from '../env';

// Set up API key for Zora SDK
if (env.ZORA_API_KEY) {
  setApiKey(env.ZORA_API_KEY);
}

// Configure viem clients
const publicClient = createPublicClient({
  chain: base,
  transport: http(env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// ZoraCoinsService: Service for interacting with Zora coins
export class ZoraCoinsService {
  
  /**
   * Creates a new coin using the Zora Coins SDK
   */
  async createCoin(params: {
    name: string;
    symbol: string;
    uri: string;
    payoutRecipient: Address;
    platformReferrer?: Address;
    owners?: Address[];
    initialPurchaseWei?: bigint;
    account: Address;
  }) {
    try {
      const walletClient = createWalletClient({
        account: params.account,
        chain: base,
        transport: http(env.BASE_RPC_URL || 'https://mainnet.base.org'),
      });
      
      const result = await createCoin({
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        payoutRecipient: params.payoutRecipient,
        platformReferrer: params.platformReferrer,
        owners: params.owners,
        initialPurchaseWei: params.initialPurchaseWei || 0n,
      }, walletClient, publicClient);
      
      return result;
    } catch (error) {
      console.error('Error creating coin:', error);
      throw error;
    }
  }
  
  /**
   * Trades a coin using the Zora Coins SDK
   */
  async tradeCoin(params: {
    coinContract: Address;
    amountIn: bigint;
    slippageBps?: number;
    platformReferrer?: Address;
    traderReferrer?: Address;
    account: Address;
  }) {
    try {
      const walletClient = createWalletClient({
        account: params.account,
        chain: base,
        transport: http(env.BASE_RPC_URL || 'https://mainnet.base.org'),
      });
      
      const result = await tradeCoin({
        coinContract: params.coinContract,
        amountIn: params.amountIn,
        slippageBps: params.slippageBps,
        platformReferrer: params.platformReferrer,
        traderReferrer: params.traderReferrer,
      }, walletClient, publicClient);
      
      return result;
    } catch (error) {
      console.error('Error trading coin:', error);
      throw error;
    }
  }
  
  /**
   * Updates a coin's URI
   */
  async updateCoinURI(params: {
    coinContract: Address;
    uri: string;
    account: Address;
  }) {
    try {
      const walletClient = createWalletClient({
        account: params.account,
        chain: base,
        transport: http(env.BASE_RPC_URL || 'https://mainnet.base.org'),
      });
      
      const result = await updateCoinURI({
        coinContract: params.coinContract,
        uri: params.uri,
      }, walletClient, publicClient);
      
      return result;
    } catch (error) {
      console.error('Error updating coin URI:', error);
      throw error;
    }
  }
  
  /**
   * Gets details for a specific coin
   */
  async getCoinDetails(coinAddress: Address) {
    try {
      return await getCoin({ address: coinAddress });
    } catch (error) {
      console.error('Error getting coin details:', error);
      throw error;
    }
  }
  
  /**
   * Gets multiple coins based on filter
   */
  async getMultipleCoins(params: {
    limit?: number;
    cursor?: string;
    addresses?: Address[];
  }) {
    try {
      return await getCoins({
        limit: params.limit,
        cursor: params.cursor,
        addresses: params.addresses,
      });
    } catch (error) {
      console.error('Error getting multiple coins:', error);
      throw error;
    }
  }
  
  /**
   * Gets profile information for an address
   */
  async getProfileInfo(address: Address) {
    try {
      return await getProfile({ address });
    } catch (error) {
      console.error('Error getting profile info:', error);
      throw error;
    }
  }
  
  /**
   * Gets profile balances for an address
   */
  async getProfileBalances(address: Address) {
    try {
      return await getProfileBalances({ address });
    } catch (error) {
      console.error('Error getting profile balances:', error);
      throw error;
    }
  }
  
  /**
   * Gets trending coins based on a time period
   */
  async getTrendingCoins(params: {
    timeframe: 'day' | 'week' | 'month';
    limit?: number;
    cursor?: string;
  }) {
    try {
      return await getExplore({
        type: 'trending',
        timeframe: params.timeframe,
        limit: params.limit,
        cursor: params.cursor,
      });
    } catch (error) {
      console.error('Error getting trending coins:', error);
      throw error;
    }
  }
  
  /**
   * Gets on-chain details for a coin
   */
  async getOnchainDetails(coinAddress: Address) {
    try {
      return await getOnchainCoinDetails(coinAddress, publicClient);
    } catch (error) {
      console.error('Error getting onchain coin details:', error);
      throw error;
    }
  }
}

export const zoraCoinsService = new ZoraCoinsService(); 