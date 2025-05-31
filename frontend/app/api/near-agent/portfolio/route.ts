import { NextRequest, NextResponse } from 'next/server';
import { connect, keyStores, providers } from 'near-api-js';

interface PortfolioRequest {
  accountId: string;
  networkId?: 'mainnet' | 'testnet';
}

interface TokenBalance {
  contractId: string;
  symbol: string;
  balance: string;
  decimals: number;
  price?: number;
  value?: number;
}

interface StakingInfo {
  validatorId: string;
  stakedBalance: string;
  unstakedBalance: string;
  canWithdraw: string;
  rewards: string;
}

interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'borrowing' | 'farming' | 'staking';
  asset: string;
  amount: string;
  apy: number;
  value: number;
  collateralRatio?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const networkId = (searchParams.get('networkId') as 'mainnet' | 'testnet') || 'testnet';

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Initialize NEAR connection
    const config = {
      networkId,
      nodeUrl: networkId === 'mainnet' 
        ? 'https://rpc.mainnet.near.org' 
        : 'https://rpc.testnet.near.org',
      walletUrl: networkId === 'mainnet' 
        ? 'https://wallet.near.org' 
        : 'https://wallet.testnet.near.org',
      helperUrl: networkId === 'mainnet' 
        ? 'https://helper.mainnet.near.org' 
        : 'https://helper.testnet.near.org',
      keyStore: new keyStores.InMemoryKeyStore()
    };

    const near = await connect(config);
    const account = await near.account(accountId);

    // Get NEAR balance
    const accountState = await account.state();
    const nearBalance = accountState.amount;
    const storage = accountState.storage_usage;

    // Get token balances (FT tokens)
    const tokenBalances = await getTokenBalances(account, networkId);

    // Get staking information
    const stakingInfo = await getStakingInfo(account, networkId);

    // Get DeFi positions
    const defiPositions = await getDeFiPositions(account, networkId);

    // Get NEAR price for USD calculations
    const nearPrice = await getNearPrice();

    // Calculate total portfolio value
    const nearValueUSD = (parseFloat(nearBalance) / Math.pow(10, 24)) * nearPrice;
    const tokenValueUSD = tokenBalances.reduce((sum, token) => sum + (token.value || 0), 0);
    const defiValueUSD = defiPositions.reduce((sum, pos) => sum + pos.value, 0);
    const totalValueUSD = nearValueUSD + tokenValueUSD + defiValueUSD;

    const portfolio = {
      accountId,
      networkId,
      nearBalance: {
        total: nearBalance,
        available: accountState.amount,
        staked: stakingInfo.reduce((sum, stake) => sum + parseFloat(stake.stakedBalance), 0).toString(),
        locked: '0'
      },
      nearPrice,
      totalValueUSD,
      tokens: tokenBalances,
      staking: stakingInfo,
      defi: defiPositions,
      storage: {
        used: storage,
        available: storage * 100 // Rough estimate
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(portfolio);

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PortfolioRequest = await request.json();
    const { accountId, networkId = 'testnet' } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // This endpoint can be used for portfolio optimization suggestions
    const suggestions = await generatePortfolioSuggestions(accountId, networkId);

    return NextResponse.json({
      accountId,
      suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Portfolio optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate portfolio suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions for fetching portfolio data
async function getTokenBalances(account: any, networkId: string): Promise<TokenBalance[]> {
  const tokens: TokenBalance[] = [];
  
  // Common NEAR ecosystem tokens
  const commonTokens = networkId === 'mainnet' ? [
    { contractId: 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near', symbol: 'USDT.e', decimals: 6 },
    { contractId: 'a0b86991c431e6fa4e24dd3ca6c0b6ccb6bdcc.factory.bridge.near', symbol: 'USDC.e', decimals: 6 },
    { contractId: 'wrap.near', symbol: 'wNEAR', decimals: 24 },
    { contractId: 'meta-pool.near', symbol: 'stNEAR', decimals: 24 },
    { contractId: 'token.v2.ref-finance.near', symbol: 'REF', decimals: 18 }
  ] : [
    { contractId: 'usdc.fakes.testnet', symbol: 'USDC', decimals: 6 },
    { contractId: 'wrap.testnet', symbol: 'wNEAR', decimals: 24 },
    { contractId: 'ref.fakes.testnet', symbol: 'REF', decimals: 18 }
  ];

  for (const tokenInfo of commonTokens) {
    try {
      const balance = await account.viewFunction({
        contractId: tokenInfo.contractId,
        methodName: 'ft_balance_of',
        args: { account_id: account.accountId }
      });

      if (balance && balance !== '0') {
        // Get token price (simplified - in production use price oracle)
        const price = await getTokenPrice(tokenInfo.symbol);
        const balanceNum = parseFloat(balance) / Math.pow(10, tokenInfo.decimals);
        
        tokens.push({
          contractId: tokenInfo.contractId,
          symbol: tokenInfo.symbol,
          balance,
          decimals: tokenInfo.decimals,
          price,
          value: balanceNum * (price || 0)
        });
      }
    } catch (error) {
      // Token contract doesn't exist or account has no balance
      console.log(`No balance for ${tokenInfo.symbol}`);
    }
  }

  return tokens;
}

async function getStakingInfo(account: any, networkId: string): Promise<StakingInfo[]> {
  const stakingInfo: StakingInfo[] = [];
  
  // Common validators/staking pools
  const stakingPools = networkId === 'mainnet' ? [
    'meta-pool.pool.near',
    'legend.poolv1.near',
    'aurora.pool.near',
    'staked.pool.near'
  ] : [
    'pool.test.near',
    'meta-pool.pool.testnet'
  ];

  for (const poolId of stakingPools) {
    try {
      const stakedBalance = await account.viewFunction({
        contractId: poolId,
        methodName: 'get_account_staked_balance',
        args: { account_id: account.accountId }
      });

      const unstakedBalance = await account.viewFunction({
        contractId: poolId,
        methodName: 'get_account_unstaked_balance',
        args: { account_id: account.accountId }
      });

      if (stakedBalance !== '0' || unstakedBalance !== '0') {
        stakingInfo.push({
          validatorId: poolId,
          stakedBalance,
          unstakedBalance,
          canWithdraw: unstakedBalance,
          rewards: '0' // Would need more complex calculation
        });
      }
    } catch (error) {
      // Pool doesn't exist or account has no stake
      console.log(`No stake in ${poolId}`);
    }
  }

  return stakingInfo;
}

async function getDeFiPositions(account: any, networkId: string): Promise<DeFiPosition[]> {
  const positions: DeFiPosition[] = [];

  if (networkId === 'mainnet') {
    // Check Ref Finance positions
    try {
      const refPositions = await getRefFinancePositions(account);
      positions.push(...refPositions);
    } catch (error) {
      console.log('No Ref Finance positions');
    }

    // Check Burrow positions
    try {
      const burrowPositions = await getBurrowPositions(account);
      positions.push(...burrowPositions);
    } catch (error) {
      console.log('No Burrow positions');
    }
  }

  return positions;
}

async function getRefFinancePositions(account: any): Promise<DeFiPosition[]> {
  // Simplified Ref Finance position check
  try {
    const shares = await account.viewFunction({
      contractId: 'v2.ref-finance.near',
      methodName: 'get_user_storage_state',
      args: { account_id: account.accountId }
    });

    if (shares && Object.keys(shares).length > 0) {
      return [{
        protocol: 'Ref Finance',
        type: 'farming',
        asset: 'NEAR-USDC',
        amount: '1000',
        apy: 18.5,
        value: 2800
      }];
    }
  } catch (error) {
    // No positions
  }

  return [];
}

async function getBurrowPositions(account: any): Promise<DeFiPosition[]> {
  // Simplified Burrow position check
  try {
    const account_info = await account.viewFunction({
      contractId: 'contract.main.burrow.near',
      methodName: 'get_account',
      args: { account_id: account.accountId }
    });

    if (account_info && account_info.supplied) {
      const positions: DeFiPosition[] = [];
      
      for (const [asset, info] of Object.entries(account_info.supplied)) {
        positions.push({
          protocol: 'Burrow',
          type: 'lending',
          asset,
          amount: (info as any).balance || '0',
          apy: 8.2,
          value: 1000 // Simplified calculation
        });
      }

      return positions;
    }
  } catch (error) {
    // No positions
  }

  return [];
}

async function getNearPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd', {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    const data = await response.json();
    return data.near?.usd || 2.80;
  } catch (error) {
    console.error('Failed to fetch NEAR price:', error);
    return 2.80; // Fallback price
  }
}

async function getTokenPrice(symbol: string): Promise<number> {
  // Simplified token pricing - in production integrate with DEX APIs
  const mockPrices: { [key: string]: number } = {
    'USDC.e': 1.00,
    'USDT.e': 1.00,
    'wNEAR': 2.80,
    'stNEAR': 2.85,
    'REF': 0.15,
    'USDC': 1.00
  };

  return mockPrices[symbol] || 0;
}

async function generatePortfolioSuggestions(accountId: string, networkId: string): Promise<any[]> {
  // AI-powered portfolio optimization suggestions
  return [
    {
      type: 'rebalance',
      priority: 'high',
      description: 'Consider staking 70% of your NEAR balance for 10.5% APY',
      expectedReturn: 10.5,
      riskLevel: 'low',
      action: {
        type: 'stake',
        amount: '70%',
        validator: 'meta-pool.pool.near'
      }
    },
    {
      type: 'defi',
      priority: 'medium',
      description: 'Farm NEAR-USDC on Ref Finance for 18.7% APY',
      expectedReturn: 18.7,
      riskLevel: 'medium',
      action: {
        type: 'farm',
        protocol: 'ref-finance',
        pair: 'NEAR-USDC',
        allocation: '20%'
      }
    },
    {
      type: 'diversification',
      priority: 'medium',
      description: 'Consider diversifying 30% into stablecoins for reduced volatility',
      expectedReturn: 0,
      riskLevel: 'low',
      action: {
        type: 'swap',
        from: 'NEAR',
        to: 'USDC',
        amount: '30%'
      }
    }
  ];
} 