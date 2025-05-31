import { NextRequest, NextResponse } from 'next/server';
import { utils } from 'near-api-js';

interface TransactionRequest {
  type: 'transfer' | 'stake' | 'unstake' | 'swap' | 'defi';
  accountId: string;
  networkId?: 'mainnet' | 'testnet';
  amount: string;
  receiverId?: string;
  validatorId?: string;
  contractId?: string;
  methodName?: string;
  args?: any;
  gas?: string;
  deposit?: string;
  memo?: string;
}

interface SwapRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut?: string;
  slippage?: number;
}

interface DeFiRequest {
  protocol: 'ref-finance' | 'burrow' | 'meta-pool' | 'pembrock';
  action: 'deposit' | 'withdraw' | 'swap' | 'farm' | 'lend' | 'borrow';
  asset: string;
  amount: string;
  pair?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionRequest = await request.json();
    const { type, accountId, networkId = 'testnet', amount } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    let transactionPayload;

    switch (type) {
      case 'transfer':
        transactionPayload = await buildTransferTransaction(body);
        break;
      case 'stake':
        transactionPayload = await buildStakeTransaction(body);
        break;
      case 'unstake':
        transactionPayload = await buildUnstakeTransaction(body);
        break;
      case 'swap':
        transactionPayload = await buildSwapTransaction(body);
        break;
      case 'defi':
        transactionPayload = await buildDeFiTransaction(body);
        break;
      default:
        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Estimate gas costs
    const gasEstimate = await estimateGasCost(transactionPayload, networkId);

    return NextResponse.json({
      transactionPayload,
      gasEstimate,
      networkId,
      timestamp: new Date().toISOString(),
      status: 'ready'
    });

  } catch (error) {
    console.error('Transaction building error:', error);
    return NextResponse.json(
      { error: 'Failed to build transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const networkId = (searchParams.get('networkId') as 'mainnet' | 'testnet') || 'testnet';

    switch (action) {
      case 'validators':
        const validators = await getValidators(networkId);
        return NextResponse.json({ validators });

      case 'tokens':
        const tokens = await getSupportedTokens(networkId);
        return NextResponse.json({ tokens });

      case 'defi-protocols':
        const protocols = await getDeFiProtocols(networkId);
        return NextResponse.json({ protocols });

      case 'gas-price':
        const gasPrice = await getCurrentGasPrice(networkId);
        return NextResponse.json({ gasPrice });

      default:
        return NextResponse.json({
          message: 'NEAR Agent Transaction API',
          endpoints: [
            'POST /api/near-agent/transactions - Build transactions',
            'GET /api/near-agent/transactions?action=validators - Get validators',
            'GET /api/near-agent/transactions?action=tokens - Get supported tokens',
            'GET /api/near-agent/transactions?action=defi-protocols - Get DeFi protocols',
            'GET /api/near-agent/transactions?action=gas-price - Get current gas price'
          ]
        });
    }

  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json(
      { error: 'API request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Transaction builders
async function buildTransferTransaction(request: TransactionRequest) {
  const { receiverId, amount, memo } = request;

  if (!receiverId) {
    throw new Error('Receiver ID is required for transfer');
  }

  const amountInYoctoNEAR = utils.format.parseNearAmount(amount);
  if (!amountInYoctoNEAR) {
    throw new Error('Invalid amount format');
  }

  return {
    receiverId,
    actions: [{
      type: 'Transfer',
      params: {
        deposit: amountInYoctoNEAR
      }
    }],
    memo: memo || `Transfer ${amount} NEAR to ${receiverId}`
  };
}

async function buildStakeTransaction(request: TransactionRequest) {
  const { validatorId, amount } = request;

  if (!validatorId) {
    throw new Error('Validator ID is required for staking');
  }

  const amountInYoctoNEAR = utils.format.parseNearAmount(amount);
  if (!amountInYoctoNEAR) {
    throw new Error('Invalid amount format');
  }

  // Different staking methods for different validators
  const stakingMethod = validatorId.includes('meta-pool') ? 'deposit_and_stake' : 'deposit_and_stake';

  return {
    receiverId: validatorId,
    actions: [{
      type: 'FunctionCall',
      params: {
        methodName: stakingMethod,
        args: {},
        gas: '50000000000000', // 50 TGas
        deposit: amountInYoctoNEAR
      }
    }],
    memo: `Stake ${amount} NEAR with ${validatorId}`
  };
}

async function buildUnstakeTransaction(request: TransactionRequest) {
  const { validatorId, amount } = request;

  if (!validatorId) {
    throw new Error('Validator ID is required for unstaking');
  }

  const amountInYoctoNEAR = utils.format.parseNearAmount(amount);
  if (!amountInYoctoNEAR) {
    throw new Error('Invalid amount format');
  }

  return {
    receiverId: validatorId,
    actions: [{
      type: 'FunctionCall',
      params: {
        methodName: 'unstake',
        args: {
          amount: amountInYoctoNEAR
        },
        gas: '50000000000000',
        deposit: '0'
      }
    }],
    memo: `Unstake ${amount} NEAR from ${validatorId}`
  };
}

async function buildSwapTransaction(request: TransactionRequest) {
  const { args, networkId } = request;
  const swapParams = args as SwapRequest;

  if (!swapParams.tokenIn || !swapParams.tokenOut || !swapParams.amountIn) {
    throw new Error('Token pair and amount are required for swap');
  }

  const contractId = networkId === 'mainnet' ? 'v2.ref-finance.near' : 'ref-finance.testnet';
  
  // Build Ref Finance swap transaction
  const swapAction = {
    pool_id: 0, // Simplified - would need to find actual pool
    token_in: swapParams.tokenIn,
    token_out: swapParams.tokenOut,
    amount_in: swapParams.amountIn,
    min_amount_out: swapParams.minAmountOut || '0'
  };

  return {
    receiverId: contractId,
    actions: [{
      type: 'FunctionCall',
      params: {
        methodName: 'swap',
        args: {
          actions: [swapAction]
        },
        gas: '100000000000000', // 100 TGas
        deposit: '1' // 1 yoctoNEAR for storage
      }
    }],
    memo: `Swap ${swapParams.amountIn} ${swapParams.tokenIn} for ${swapParams.tokenOut}`
  };
}

async function buildDeFiTransaction(request: TransactionRequest) {
  const { args, networkId } = request;
  const defiParams = args as DeFiRequest;

  if (!defiParams.protocol || !defiParams.action || !defiParams.asset || !defiParams.amount) {
    throw new Error('Protocol, action, asset, and amount are required for DeFi operations');
  }

  switch (defiParams.protocol) {
    case 'ref-finance':
      return buildRefFinanceTransaction(defiParams, networkId);
    case 'burrow':
      return buildBurrowTransaction(defiParams, networkId);
    case 'meta-pool':
      return buildMetaPoolTransaction(defiParams, networkId);
    default:
      throw new Error(`Unsupported DeFi protocol: ${defiParams.protocol}`);
  }
}

async function buildRefFinanceTransaction(params: DeFiRequest, networkId?: string) {
  const contractId = networkId === 'mainnet' ? 'v2.ref-finance.near' : 'ref-finance.testnet';
  
  switch (params.action) {
    case 'deposit':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'add_liquidity',
            args: {
              pool_id: 0,
              amounts: [params.amount, '0']
            },
            gas: '100000000000000',
            deposit: utils.format.parseNearAmount(params.amount) || '0'
          }
        }],
        memo: `Add liquidity to ${params.asset} pool on Ref Finance`
      };

    case 'withdraw':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'remove_liquidity',
            args: {
              pool_id: 0,
              shares: params.amount,
              min_amounts: ['0', '0']
            },
            gas: '100000000000000',
            deposit: '1'
          }
        }],
        memo: `Remove liquidity from ${params.asset} pool on Ref Finance`
      };

    default:
      throw new Error(`Unsupported Ref Finance action: ${params.action}`);
  }
}

async function buildBurrowTransaction(params: DeFiRequest, networkId?: string) {
  const contractId = networkId === 'mainnet' ? 'contract.main.burrow.near' : 'contract.burrow.testnet';
  
  switch (params.action) {
    case 'lend':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'supply',
            args: {
              token_id: params.asset,
              amount: params.amount
            },
            gas: '100000000000000',
            deposit: '1'
          }
        }],
        memo: `Supply ${params.amount} ${params.asset} to Burrow`
      };

    case 'borrow':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'borrow',
            args: {
              token_id: params.asset,
              amount: params.amount
            },
            gas: '100000000000000',
            deposit: '1'
          }
        }],
        memo: `Borrow ${params.amount} ${params.asset} from Burrow`
      };

    default:
      throw new Error(`Unsupported Burrow action: ${params.action}`);
  }
}

async function buildMetaPoolTransaction(params: DeFiRequest, networkId?: string) {
  const contractId = networkId === 'mainnet' ? 'meta-pool.near' : 'meta-pool.testnet';
  
  switch (params.action) {
    case 'deposit':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'deposit_and_stake',
            args: {},
            gas: '50000000000000',
            deposit: utils.format.parseNearAmount(params.amount) || '0'
          }
        }],
        memo: `Stake ${params.amount} NEAR in Meta Pool`
      };

    case 'withdraw':
      return {
        receiverId: contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'unstake',
            args: {
              amount: params.amount
            },
            gas: '50000000000000',
            deposit: '0'
          }
        }],
        memo: `Unstake ${params.amount} stNEAR from Meta Pool`
      };

    default:
      throw new Error(`Unsupported Meta Pool action: ${params.action}`);
  }
}

// Helper functions
async function estimateGasCost(transaction: any, networkId: string): Promise<{
  gasLimit: string;
  gasCost: string;
  costInNear: string;
}> {
  // Simplified gas estimation - in production would use actual RPC calls
  const baseGas = '30000000000000'; // 30 TGas
  const gasPrice = '100000000'; // 0.0001 NEAR per TGas
  
  return {
    gasLimit: baseGas,
    gasCost: gasPrice,
    costInNear: utils.format.formatNearAmount((BigInt(baseGas) * BigInt(gasPrice)).toString()) || '0'
  };
}

async function getValidators(networkId: string): Promise<any[]> {
  // In production, fetch from NEAR RPC
  const mainnetValidators = [
    {
      validatorId: 'meta-pool.pool.near',
      name: 'Meta Pool',
      fee: 3.0,
      apy: 11.5,
      totalStaked: '45000000',
      isActive: true,
      description: 'Liquid staking with stNEAR tokens'
    },
    {
      validatorId: 'legend.poolv1.near',
      name: 'LegendaryValidation',
      fee: 5.0,
      apy: 10.8,
      totalStaked: '32000000',
      isActive: true,
      description: 'Reliable validator with high uptime'
    },
    {
      validatorId: 'aurora.pool.near',
      name: 'Aurora Pool',
      fee: 3.0,
      apy: 11.2,
      totalStaked: '28000000',
      isActive: true,
      description: 'Ethereum bridge operator validator'
    }
  ];

  const testnetValidators = [
    {
      validatorId: 'pool.test.near',
      name: 'Test Pool',
      fee: 5.0,
      apy: 10.0,
      totalStaked: '1000000',
      isActive: true,
      description: 'Testnet validator for development'
    }
  ];

  return networkId === 'mainnet' ? mainnetValidators : testnetValidators;
}

async function getSupportedTokens(networkId: string): Promise<any[]> {
  const mainnetTokens = [
    { contractId: 'wrap.near', symbol: 'wNEAR', decimals: 24, name: 'Wrapped NEAR' },
    { contractId: 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near', symbol: 'USDT.e', decimals: 6, name: 'Bridged USDT' },
    { contractId: 'a0b86991c431e6fa4e24dd3ca6c0b6ccb6bdcc.factory.bridge.near', symbol: 'USDC.e', decimals: 6, name: 'Bridged USDC' },
    { contractId: 'meta-pool.near', symbol: 'stNEAR', decimals: 24, name: 'Meta Pool Staked NEAR' },
    { contractId: 'token.v2.ref-finance.near', symbol: 'REF', decimals: 18, name: 'Ref Finance Token' }
  ];

  const testnetTokens = [
    { contractId: 'wrap.testnet', symbol: 'wNEAR', decimals: 24, name: 'Wrapped NEAR (Testnet)' },
    { contractId: 'usdc.fakes.testnet', symbol: 'USDC', decimals: 6, name: 'Fake USDC (Testnet)' },
    { contractId: 'ref.fakes.testnet', symbol: 'REF', decimals: 18, name: 'Fake REF (Testnet)' }
  ];

  return networkId === 'mainnet' ? mainnetTokens : testnetTokens;
}

async function getDeFiProtocols(networkId: string): Promise<any[]> {
  const protocols = [
    {
      name: 'Ref Finance',
      contractId: networkId === 'mainnet' ? 'v2.ref-finance.near' : 'ref-finance.testnet',
      category: 'DEX',
      tvl: 85000000,
      features: ['swap', 'liquidity', 'farming'],
      description: 'Leading NEAR DEX and AMM'
    },
    {
      name: 'Burrow',
      contractId: networkId === 'mainnet' ? 'contract.main.burrow.near' : 'contract.burrow.testnet',
      category: 'Lending',
      tvl: 45000000,
      features: ['lend', 'borrow', 'leverage'],
      description: 'Decentralized money market'
    },
    {
      name: 'Meta Pool',
      contractId: networkId === 'mainnet' ? 'meta-pool.near' : 'meta-pool.testnet',
      category: 'Staking',
      tvl: 120000000,
      features: ['stake', 'unstake', 'liquid_staking'],
      description: 'Liquid staking protocol'
    }
  ];

  return protocols;
}

async function getCurrentGasPrice(networkId: string): Promise<{
  gasPrice: string;
  gasPriceNear: string;
  estimatedCosts: any;
}> {
  return {
    gasPrice: '100000000', // yoctoNEAR per gas unit
    gasPriceNear: '0.0001',
    estimatedCosts: {
      transfer: '0.001 NEAR',
      functionCall: '0.003 NEAR',
      stake: '0.005 NEAR',
      swap: '0.01 NEAR'
    }
  };
} 