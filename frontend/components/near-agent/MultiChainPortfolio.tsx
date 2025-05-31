"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNearAgent } from '@/contexts/NearAgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Settings,
  Link,
  Unlink,
  Bitcoin,
  Zap
} from 'lucide-react';

interface ChainAsset {
  chain: 'near' | 'bitcoin' | 'ethereum' | 'polygon' | 'avalanche';
  symbol: string;
  name: string;
  address?: string;
  balance: string;
  usdValue: number;
  price: number;
  change24h: number;
  icon: string;
}

interface ChainBalance {
  chain: 'near' | 'bitcoin' | 'ethereum' | 'polygon' | 'avalanche';
  chainName: string;
  nativeSymbol: string;
  totalUsdValue: number;
  assets: ChainAsset[];
  isConnected: boolean;
  address?: string;
  lastUpdated: Date;
}

interface PortfolioAllocation {
  chain: string;
  percentage: number;
  value: number;
  color: string;
}

const MultiChainPortfolio: React.FC = () => {
  const { state, connectWallet } = useNearAgent();
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [portfolioAllocations, setPortfolioAllocations] = useState<PortfolioAllocation[]>([]);
  const [isGeneratingAddresses, setIsGeneratingAddresses] = useState(false);

  useEffect(() => {
    if (state.isConnected) {
      loadMultiChainPortfolio();
    }
  }, [state.isConnected]);

  const loadMultiChainPortfolio = async () => {
    try {
      setLoading(true);
      
      // Generate multi-chain addresses using NEAR MPC
      const addresses = await generateMultiChainAddresses();
      
      // Mock data - in production, fetch from multiple blockchain APIs
      const mockChainBalances: ChainBalance[] = [
        {
          chain: 'near',
          chainName: 'NEAR Protocol',
          nativeSymbol: 'NEAR',
          totalUsdValue: 8450.50,
          isConnected: true,
          address: state.accountId || 'alice.near',
          lastUpdated: new Date(),
          assets: [
            {
              chain: 'near',
              symbol: 'NEAR',
              name: 'NEAR Protocol',
              balance: '3021.50',
              usdValue: 8460.20,
              price: 2.80,
              change24h: 5.2,
              icon: '🔷'
            },
            {
              chain: 'near',
              symbol: 'USDC.e',
              name: 'USD Coin',
              balance: '1500.00',
              usdValue: 1500.00,
              price: 1.00,
              change24h: 0.1,
              icon: '💵'
            },
            {
              chain: 'near',
              symbol: 'stNEAR',
              name: 'Staked NEAR',
              balance: '850.00',
              usdValue: 2380.00,
              price: 2.80,
              change24h: 5.2,
              icon: '💎'
            }
          ]
        },
        {
          chain: 'bitcoin',
          chainName: 'Bitcoin',
          nativeSymbol: 'BTC',
          totalUsdValue: 12850.00,
          isConnected: true,
          address: addresses.bitcoinAddress,
          lastUpdated: new Date(),
          assets: [
            {
              chain: 'bitcoin',
              symbol: 'BTC',
              name: 'Bitcoin',
              balance: '0.2150',
              usdValue: 12850.00,
              price: 59767.44,
              change24h: 2.8,
              icon: '₿'
            }
          ]
        },
        {
          chain: 'ethereum',
          chainName: 'Ethereum',
          nativeSymbol: 'ETH',
          totalUsdValue: 6720.00,
          isConnected: true,
          address: addresses.ethereumAddress,
          lastUpdated: new Date(),
          assets: [
            {
              chain: 'ethereum',
              symbol: 'ETH',
              name: 'Ethereum',
              balance: '2.8450',
              usdValue: 6720.00,
              price: 2361.50,
              change24h: 1.2,
              icon: '⟠'
            },
            {
              chain: 'ethereum',
              symbol: 'USDC',
              name: 'USD Coin',
              balance: '800.00',
              usdValue: 800.00,
              price: 1.00,
              change24h: 0.0,
              icon: '💵'
            }
          ]
        },
        {
          chain: 'polygon',
          chainName: 'Polygon',
          nativeSymbol: 'MATIC',
          totalUsdValue: 245.50,
          isConnected: false,
          lastUpdated: new Date(),
          assets: []
        },
        {
          chain: 'avalanche',
          chainName: 'Avalanche',
          nativeSymbol: 'AVAX',
          totalUsdValue: 0,
          isConnected: false,
          lastUpdated: new Date(),
          assets: []
        }
      ];

      setChainBalances(mockChainBalances);
      calculatePortfolioMetrics(mockChainBalances);
    } catch (error) {
      console.error('Failed to load multi-chain portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMultiChainAddresses = async (): Promise<{
    nearAddress: string;
    bitcoinAddress: string;
    ethereumAddress: string;
  }> => {
    try {
      setIsGeneratingAddresses(true);
      // In production, use NEAR agent's MPC functionality
      // For now, return mock addresses
      return {
        nearAddress: state.accountId || 'alice.near',
        bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        ethereumAddress: '0x742d35Cc6634C0532925a3b8D25D62E0fA3B35a2'
      };
    } finally {
      setIsGeneratingAddresses(false);
    }
  };

  const calculatePortfolioMetrics = (balances: ChainBalance[]) => {
    const total = balances.reduce((sum, chain) => sum + chain.totalUsdValue, 0);
    setTotalPortfolioValue(total);

    const allocations: PortfolioAllocation[] = balances
      .filter(chain => chain.totalUsdValue > 0)
      .map((chain, index) => ({
        chain: chain.chainName,
        percentage: (chain.totalUsdValue / total) * 100,
        value: chain.totalUsdValue,
        color: getChainColor(chain.chain)
      }));

    setPortfolioAllocations(allocations);
  };

  const getChainColor = (chain: string): string => {
    const colors: Record<string, string> = {
      near: '#00C08B',
      bitcoin: '#F7931A',
      ethereum: '#627EEA',
      polygon: '#8247E5',
      avalanche: '#E84142'
    };
    return colors[chain] || '#6B7280';
  };

  const getChainIcon = (chain: string) => {
    const icons: Record<string, React.ReactNode> = {
      near: <span className="text-lg">🔷</span>,
      bitcoin: <Bitcoin className="h-5 w-5 text-orange-500" />,
      ethereum: <span className="text-lg">⟠</span>,
      polygon: <span className="text-lg">🟣</span>,
      avalanche: <span className="text-lg">🔺</span>
    };
    return icons[chain] || <Globe className="h-5 w-5" />;
  };

  const filteredChains = chainBalances.filter(chain => {
    if (selectedChain !== 'all' && chain.chain !== selectedChain) return false;
    if (!showZeroBalances && chain.totalUsdValue === 0) return false;
    return true;
  });

  const connectChain = async (chainId: string) => {
    try {
      // In production, implement chain-specific connection logic
      console.log(`Connecting to ${chainId}...`);
      
      // Mock connection success
      setChainBalances(prev => 
        prev.map(chain => 
          chain.chain === chainId 
            ? { ...chain, isConnected: true }
            : chain
        )
      );
    } catch (error) {
      console.error(`Failed to connect to ${chainId}:`, error);
    }
  };

  if (!state.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <Globe className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 mb-6">Connect your NEAR wallet to view your multi-chain portfolio</p>
        <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
          Connect NEAR Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Portfolio Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-3xl font-bold">${totalPortfolioValue.toLocaleString()}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMultiChainPortfolio}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZeroBalances(!showZeroBalances)}
                >
                  {showZeroBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Connected Chains</p>
                <p className="text-xl font-semibold">
                  {chainBalances.filter(c => c.isConnected).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Assets</p>
                <p className="text-xl font-semibold">
                  {chainBalances.reduce((sum, c) => sum + c.assets.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">24h Change</p>
                <p className="text-xl font-semibold text-green-600">+$342.50</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chain Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioAllocations.slice(0, 3).map((allocation) => (
                <div key={allocation.chain} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: allocation.color }}
                    />
                    <span className="text-sm">{allocation.chain}</span>
                  </div>
                  <span className="text-sm font-medium">{allocation.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MPC Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs">
                <p className="text-gray-600">Bitcoin</p>
                <p className="font-mono">bc1q...x0wlh</p>
              </div>
              <div className="text-xs">
                <p className="text-gray-600">Ethereum</p>
                <p className="font-mono">0x742d...35a2</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={generateMultiChainAddresses}
                disabled={isGeneratingAddresses}
              >
                {isGeneratingAddresses ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Generate New
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chain Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">All Chains</option>
              <option value="near">NEAR Protocol</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="avalanche">Avalanche</option>
            </select>
            
            <Badge variant="outline">
              {filteredChains.length} chains shown
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Chain Balances */}
      <div className="space-y-4">
        {filteredChains.map((chain, index) => (
          <motion.div
            key={chain.chain}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getChainIcon(chain.chain)}
                    <div>
                      <h3 className="font-semibold">{chain.chainName}</h3>
                      <p className="text-sm text-gray-600">
                        {chain.isConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">${chain.totalUsdValue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {chain.assets.length} assets
                      </p>
                    </div>
                    
                    {!chain.isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectChain(chain.chain)}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {chain.isConnected && chain.assets.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {chain.assets.map((asset) => (
                      <div key={`${asset.chain}-${asset.symbol}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{asset.icon}</span>
                          <div>
                            <h4 className="font-medium">{asset.symbol}</h4>
                            <p className="text-sm text-gray-600">{asset.name}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{parseFloat(asset.balance).toFixed(4)} {asset.symbol}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-600">${asset.usdValue.toLocaleString()}</p>
                            <div className={`flex items-center ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.change24h >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              <span className="text-xs">{Math.abs(asset.change24h).toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {chain.address && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-mono text-sm break-all">{chain.address}</p>
                    </div>
                  )}
                </CardContent>
              )}
              
              {chain.isConnected && chain.assets.length === 0 && (
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No assets found on {chain.chainName}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Cross-Chain Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <ArrowUpRight className="h-6 w-6 mb-2" />
              <span>Bridge Assets</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span>Cross-Chain Swap</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Portfolio Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiChainPortfolio; 