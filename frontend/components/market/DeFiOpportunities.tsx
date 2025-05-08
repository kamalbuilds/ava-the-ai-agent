"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Shield, Clock, ExternalLink, Star, Filter } from 'lucide-react';

interface DeFiOpportunity {
  id: string;
  protocol: string;
  chain: 'near' | 'ethereum' | 'bitcoin';
  type: 'staking' | 'lending' | 'farming' | 'liquidity';
  asset: string;
  apy: string;
  tvl: string;
  riskLevel: 'low' | 'medium' | 'high';
  lockPeriod: string;
  minAmount: string;
  description: string;
  verified: boolean;
  trending: boolean;
  logo: string;
}

interface DeFiOpportunitiesProps {
  selectedChain?: string;
  sortBy?: 'apy' | 'tvl' | 'risk';
}

const DeFiOpportunities: React.FC<DeFiOpportunitiesProps> = ({
  selectedChain = 'all',
  sortBy = 'apy'
}) => {
  const [opportunities, setOpportunities] = useState<DeFiOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    riskLevel: 'all',
    minAPY: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // Mock DeFi opportunities data
  const mockOpportunities: DeFiOpportunity[] = [
    {
      id: '1',
      protocol: 'NEAR Staking',
      chain: 'near',
      type: 'staking',
      asset: 'NEAR',
      apy: '12.5%',
      tvl: '450M',
      riskLevel: 'low',
      lockPeriod: '3 epochs (~36h)',
      minAmount: '1 NEAR',
      description: 'Stake NEAR tokens to secure the network and earn rewards',
      verified: true,
      trending: true,
      logo: '🔗'
    },
    {
      id: '2',
      protocol: 'Ref Finance',
      chain: 'near',
      type: 'farming',
      asset: 'NEAR-USDC',
      apy: '18.7%',
      tvl: '125M',
      riskLevel: 'medium',
      lockPeriod: 'Flexible',
      minAmount: '10 USDC',
      description: 'Provide liquidity to NEAR-USDC pool and earn REF tokens',
      verified: true,
      trending: true,
      logo: '💧'
    },
    {
      id: '3',
      protocol: 'Burrow',
      chain: 'near',
      type: 'lending',
      asset: 'USDC',
      apy: '8.2%',
      tvl: '85M',
      riskLevel: 'low',
      lockPeriod: 'None',
      minAmount: '1 USDC',
      description: 'Supply USDC to earn interest from borrowers',
      verified: true,
      trending: false,
      logo: '🏦'
    },
    {
      id: '4',
      protocol: 'Ethereum Staking',
      chain: 'ethereum',
      type: 'staking',
      asset: 'ETH',
      apy: '5.8%',
      tvl: '28B',
      riskLevel: 'low',
      lockPeriod: 'Until ETH2 merge',
      minAmount: '32 ETH',
      description: 'Participate in Ethereum 2.0 staking to secure the network',
      verified: true,
      trending: false,
      logo: '⚡'
    },
    {
      id: '5',
      protocol: 'Uniswap V3',
      chain: 'ethereum',
      type: 'liquidity',
      asset: 'ETH-USDC',
      apy: '15.3%',
      tvl: '2.1B',
      riskLevel: 'medium',
      lockPeriod: 'Flexible',
      minAmount: '0.1 ETH',
      description: 'Provide concentrated liquidity and earn trading fees',
      verified: true,
      trending: true,
      logo: '🦄'
    },
    {
      id: '6',
      protocol: 'Lightning Pool',
      chain: 'bitcoin',
      type: 'liquidity',
      asset: 'BTC',
      apy: '6.5%',
      tvl: '120M',
      riskLevel: 'medium',
      lockPeriod: '30 days',
      minAmount: '0.001 BTC',
      description: 'Provide Lightning Network liquidity and earn routing fees',
      verified: true,
      trending: false,
      logo: '⚡'
    }
  ];

  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOpportunities(mockOpportunities);
      setLoading(false);
    };

    loadOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedChain !== 'all' && opp.chain !== selectedChain) return false;
    if (filter.type !== 'all' && opp.type !== filter.type) return false;
    if (filter.riskLevel !== 'all' && opp.riskLevel !== filter.riskLevel) return false;
    
    const apyValue = parseFloat(opp.apy.replace('%', ''));
    if (apyValue < filter.minAPY) return false;
    
    return true;
  });

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    switch (sortBy) {
      case 'apy':
        return parseFloat(b.apy.replace('%', '')) - parseFloat(a.apy.replace('%', ''));
      case 'tvl':
        const aTvl = parseFloat(a.tvl.replace(/[^\d.]/g, ''));
        const bTvl = parseFloat(b.tvl.replace(/[^\d.]/g, ''));
        return bTvl - aTvl;
      case 'risk':
        const riskOrder = { low: 1, medium: 2, high: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      default:
        return 0;
    }
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getChainIcon = (chain: string) => {
    switch (chain) {
      case 'near': return '🔗';
      case 'ethereum': return '⚡';
      case 'bitcoin': return '₿';
      default: return '🔗';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'staking': return <Shield className="w-4 h-4" />;
      case 'lending': return <Coins className="w-4 h-4" />;
      case 'farming': return <TrendingUp className="w-4 h-4" />;
      case 'liquidity': return <Clock className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Coins className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold">DeFi Opportunities</h3>
          <span className="px-2 py-1 bg-green-400/20 text-green-400 text-sm rounded-full">
            {sortedOpportunities.length} available
          </span>
        </div>

        {/* Filter Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filters</span>
        </motion.button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Types</option>
                  <option value="staking">Staking</option>
                  <option value="lending">Lending</option>
                  <option value="farming">Farming</option>
                  <option value="liquidity">Liquidity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Risk Level</label>
                <select
                  value={filter.riskLevel}
                  onChange={(e) => setFilter(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Min APY (%)</label>
                <input
                  type="number"
                  value={filter.minAPY}
                  onChange={(e) => setFilter(prev => ({ ...prev, minAPY: Number(e.target.value) }))}
                  className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opportunities List */}
      <div className="space-y-4">
        {sortedOpportunities.map((opportunity, index) => (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Protocol Icon & Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{opportunity.logo}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{opportunity.protocol}</h4>
                      {opportunity.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                      {opportunity.trending && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-orange-400/20 text-orange-400 rounded-full">
                          <Star className="w-3 h-3" />
                          <span className="text-xs">Trending</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-400">{opportunity.asset}</span>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{getChainIcon(opportunity.chain)}</span>
                        <span className="text-sm text-gray-400 capitalize">{opportunity.chain}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-gray-400">APY</div>
                  <div className="text-lg font-bold text-green-400">{opportunity.apy}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">TVL</div>
                  <div className="text-lg font-bold">${opportunity.tvl}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Risk</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(opportunity.riskLevel)}`}>
                    {opportunity.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                {getTypeIcon(opportunity.type)}
                <div>
                  <div className="text-sm text-gray-400">Type</div>
                  <div className="text-sm font-medium capitalize">{opportunity.type}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Lock Period</div>
                  <div className="text-sm font-medium">{opportunity.lockPeriod}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Min Amount</div>
                  <div className="text-sm font-medium">{opportunity.minAmount}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-3 text-sm text-gray-300">{opportunity.description}</p>

            {/* Action Button */}
            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <span>Learn More</span>
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {sortedOpportunities.length === 0 && (
        <div className="text-center py-8">
          <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No opportunities found</h4>
          <p className="text-sm text-gray-500">Try adjusting your filters to see more options</p>
        </div>
      )}

      {/* Risk Disclaimer */}
      <div className="mt-6 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium">DeFi Risk Warning</p>
            <p className="text-gray-300 mt-1">
              DeFi protocols carry smart contract risks. APYs are variable and past performance doesn't guarantee future results. 
              Always research protocols thoroughly and only invest what you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeFiOpportunities; 