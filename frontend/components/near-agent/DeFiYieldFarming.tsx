"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNearAgent } from '@/contexts/NearAgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  TrendingUp, 
  Coins, 
  DollarSign, 
  Zap, 
  Clock, 
  Users, 
  BarChart3,
  ExternalLink,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Flame
} from 'lucide-react';

interface YieldFarm {
  id: string;
  protocol: string;
  pair: string;
  tokenA: string;
  tokenB: string;
  apy: number;
  tvl: number;
  dailyVolume: number;
  riskScore: number;
  rewards: string[];
  contractId: string;
  poolId: number;
}

interface LiquidityPosition {
  id: string;
  protocol: string;
  pair: string;
  lpTokens: string;
  totalValue: number;
  tokenAAmount: string;
  tokenBAmount: string;
  currentApy: number;
  rewards: string;
  impermanentLoss: number;
}

interface YieldStrategy {
  name: string;
  description: string;
  expectedApy: number;
  riskLevel: 'low' | 'medium' | 'high';
  protocols: string[];
  allocation: { [key: string]: number };
}

const DeFiYieldFarming: React.FC = () => {
  const { state, connectWallet, buildTransaction, executeTransaction } = useNearAgent();
  const [activeTab, setActiveTab] = useState<'explore' | 'positions' | 'strategies'>('explore');
  const [selectedFarm, setSelectedFarm] = useState<YieldFarm | null>(null);
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [yieldFarms, setYieldFarms] = useState<YieldFarm[]>([]);
  const [liquidityPositions, setLiquidityPositions] = useState<LiquidityPosition[]>([]);
  const [yieldStrategies] = useState<YieldStrategy[]>([
    {
      name: 'Conservative Stablecoin Strategy',
      description: 'Low-risk farming with stablecoin pairs for steady yields',
      expectedApy: 12.5,
      riskLevel: 'low',
      protocols: ['Ref Finance', 'Burrow'],
      allocation: { 'USDC-USDT': 60, 'NEAR-USDC': 40 }
    },
    {
      name: 'Balanced Growth Strategy',
      description: 'Medium-risk strategy balancing stability and growth',
      expectedApy: 18.7,
      riskLevel: 'medium',
      protocols: ['Ref Finance', 'Meta Pool'],
      allocation: { 'NEAR-USDC': 50, 'stNEAR-NEAR': 30, 'REF-NEAR': 20 }
    },
    {
      name: 'High Yield Hunter',
      description: 'Aggressive strategy targeting maximum yields',
      expectedApy: 28.4,
      riskLevel: 'high',
      protocols: ['Ref Finance', 'Pembrock', 'Burrow'],
      allocation: { 'REF-NEAR': 40, 'AURORA-NEAR': 30, 'New Pairs': 30 }
    }
  ]);

  useEffect(() => {
    loadYieldFarms();
    if (state.isConnected) {
      loadLiquidityPositions();
    }
  }, [state.isConnected]);

  const loadYieldFarms = async () => {
    // Mock data - in production, fetch from DeFi protocols
    const mockFarms: YieldFarm[] = [
      {
        id: 'ref-near-usdc',
        protocol: 'Ref Finance',
        pair: 'NEAR-USDC',
        tokenA: 'NEAR',
        tokenB: 'USDC',
        apy: 18.7,
        tvl: 12500000,
        dailyVolume: 890000,
        riskScore: 3,
        rewards: ['REF', 'NEAR'],
        contractId: 'v2.ref-finance.near',
        poolId: 1
      },
      {
        id: 'ref-stnear-near',
        protocol: 'Ref Finance',
        pair: 'stNEAR-NEAR',
        tokenA: 'stNEAR',
        tokenB: 'NEAR',
        apy: 24.3,
        tvl: 8200000,
        dailyVolume: 520000,
        riskScore: 2,
        rewards: ['REF', 'META'],
        contractId: 'v2.ref-finance.near',
        poolId: 2
      },
      {
        id: 'ref-usdc-usdt',
        protocol: 'Ref Finance',
        pair: 'USDC-USDT',
        tokenA: 'USDC',
        tokenB: 'USDT',
        apy: 8.5,
        tvl: 25000000,
        dailyVolume: 1200000,
        riskScore: 1,
        rewards: ['REF'],
        contractId: 'v2.ref-finance.near',
        poolId: 3
      },
      {
        id: 'burrow-near',
        protocol: 'Burrow',
        pair: 'NEAR Supply',
        tokenA: 'NEAR',
        tokenB: '',
        apy: 8.2,
        tvl: 45000000,
        dailyVolume: 2100000,
        riskScore: 2,
        rewards: ['BRRR'],
        contractId: 'contract.main.burrow.near',
        poolId: 0
      },
      {
        id: 'ref-ref-near',
        protocol: 'Ref Finance',
        pair: 'REF-NEAR',
        tokenA: 'REF',
        tokenB: 'NEAR',
        apy: 32.1,
        tvl: 3200000,
        dailyVolume: 180000,
        riskScore: 4,
        rewards: ['REF'],
        contractId: 'v2.ref-finance.near',
        poolId: 4
      }
    ];
    setYieldFarms(mockFarms);
  };

  const loadLiquidityPositions = async () => {
    // Mock positions - in production, fetch from user's portfolio
    const mockPositions: LiquidityPosition[] = [
      {
        id: '1',
        protocol: 'Ref Finance',
        pair: 'NEAR-USDC',
        lpTokens: '1250.5',
        totalValue: 3500,
        tokenAAmount: '500.0',
        tokenBAmount: '1400.0',
        currentApy: 18.7,
        rewards: '45.2',
        impermanentLoss: -2.3
      },
      {
        id: '2',
        protocol: 'Ref Finance',
        pair: 'stNEAR-NEAR',
        lpTokens: '800.0',
        totalValue: 2240,
        tokenAAmount: '400.0',
        tokenBAmount: '400.0',
        currentApy: 24.3,
        rewards: '28.7',
        impermanentLoss: 0.8
      }
    ];
    setLiquidityPositions(mockPositions);
  };

  const handleProvideLiquidity = async () => {
    if (!selectedFarm || !tokenAAmount || !tokenBAmount || !state.isConnected) return;

    try {
      setLoading(true);
      const transaction = await buildTransaction({
        type: 'defi',
        contractId: selectedFarm.contractId,
        methodName: 'add_liquidity',
        args: {
          pool_id: selectedFarm.poolId,
          amounts: [tokenAAmount, tokenBAmount]
        },
        gas: '100000000000000',
        deposit: '1'
      });

      await executeTransaction(transaction);
      setTokenAAmount('');
      setTokenBAmount('');
      loadLiquidityPositions();
    } catch (error) {
      console.error('Liquidity provision failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore <= 2) return 'bg-green-100 text-green-800';
    if (riskScore <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 2) return 'Low Risk';
    if (riskScore <= 3) return 'Medium Risk';
    return 'High Risk';
  };

  const calculateTotalYield = () => {
    return liquidityPositions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0);
  };

  const calculateTotalValue = () => {
    return liquidityPositions.reduce((sum, pos) => sum + pos.totalValue, 0);
  };

  if (!state.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <Sprout className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 mb-6">Connect your NEAR wallet to explore DeFi yield farming opportunities</p>
        <Button onClick={connectWallet} className="bg-green-600 hover:bg-green-700">
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Farming Value</p>
                <p className="text-2xl font-bold">${calculateTotalValue().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Yield Earned</p>
                <p className="text-2xl font-bold text-green-600">{calculateTotalYield().toFixed(2)} NEAR</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Farms</p>
                <p className="text-2xl font-bold">{liquidityPositions.length}</p>
              </div>
              <Sprout className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg APY</p>
                <p className="text-2xl font-bold">
                  {liquidityPositions.length > 0 
                    ? (liquidityPositions.reduce((sum, pos) => sum + pos.currentApy, 0) / liquidityPositions.length).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {(['explore', 'positions', 'strategies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Explore Tab */}
      {activeTab === 'explore' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Farm List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sprout className="h-5 w-5 mr-2" />
                  Available Yield Farms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {yieldFarms.map((farm) => (
                  <motion.div
                    key={farm.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedFarm(farm)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedFarm?.id === farm.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{farm.pair}</h3>
                          <Badge variant="outline">{farm.protocol}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            TVL: ${(farm.tvl / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-sm text-gray-600">
                            Vol: ${(farm.dailyVolume / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{farm.apy}%</div>
                        <div className="text-sm text-gray-600">APY</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(farm.riskScore)}>
                          {getRiskLabel(farm.riskScore)}
                        </Badge>
                        <div className="flex space-x-1">
                          {farm.rewards.map((reward, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {farm.apy > 25 && (
                        <div className="flex items-center text-orange-600">
                          <Flame className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Hot</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Liquidity Form */}
          <Card>
            <CardHeader>
              <CardTitle>Provide Liquidity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedFarm ? (
                <>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">Selected Farm</p>
                    <p className="text-green-600">{selectedFarm.pair}</p>
                    <p className="text-sm text-gray-600">{selectedFarm.apy}% APY</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {selectedFarm.tokenA} Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tokenAAmount}
                      onChange={(e) => setTokenAAmount(e.target.value)}
                    />
                  </div>

                  {selectedFarm.tokenB && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {selectedFarm.tokenB} Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={tokenBAmount}
                        onChange={(e) => setTokenBAmount(e.target.value)}
                      />
                    </div>
                  )}

                  {tokenAAmount && tokenBAmount && (
                    <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pool Share</span>
                        <span>~0.05%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Est. Daily Rewards</span>
                        <span className="text-green-600">
                          {((parseFloat(tokenAAmount) + parseFloat(tokenBAmount)) * selectedFarm.apy / 365 / 100).toFixed(4)} tokens
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleProvideLiquidity}
                    disabled={!tokenAAmount || (!selectedFarm.tokenB || !tokenBAmount) || loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a farm to provide liquidity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Liquidity Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {liquidityPositions.length > 0 ? (
                <div className="space-y-4">
                  {liquidityPositions.map((position, index) => (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{position.pair}</h3>
                          <p className="text-sm text-gray-600">{position.protocol}</p>
                        </div>
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="font-semibold">${position.totalValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current APY</p>
                          <p className="font-semibold text-green-600">{position.currentApy}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rewards</p>
                          <p className="font-semibold text-blue-600">{position.rewards} tokens</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">IL</p>
                          <p className={`font-semibold ${position.impermanentLoss < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {position.impermanentLoss > 0 ? '+' : ''}{position.impermanentLoss.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add More
                        </Button>
                        <Button variant="outline" size="sm">
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        <Button variant="outline" size="sm" className="text-blue-600">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Claim Rewards
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sprout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                  <p className="text-gray-600 mb-6">Start farming to earn DeFi yields</p>
                  <Button onClick={() => setActiveTab('explore')} className="bg-green-600 hover:bg-green-700">
                    Explore Farms
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Strategies Tab */}
      {activeTab === 'strategies' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {yieldStrategies.map((strategy, index) => (
            <Card key={strategy.name} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <Badge className={
                    strategy.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    strategy.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {strategy.riskLevel} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{strategy.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expected APY</span>
                  <span className="text-2xl font-bold text-green-600">{strategy.expectedApy}%</span>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Protocols</p>
                  <div className="flex flex-wrap gap-1">
                    {strategy.protocols.map((protocol) => (
                      <Badge key={protocol} variant="secondary" className="text-xs">
                        {protocol}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Allocation</p>
                  <div className="space-y-1">
                    {Object.entries(strategy.allocation).map(([pair, percentage]) => (
                      <div key={pair} className="flex justify-between text-sm">
                        <span>{pair}</span>
                        <span>{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant={index === 1 ? 'primary' : 'outline'}>
                  {index === 1 ? 'Recommended' : 'Deploy Strategy'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DeFiYieldFarming; 