"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Coins, Users, Sword, Shield, Star, Zap } from 'lucide-react';

interface GameAsset {
  id: string;
  name: string;
  type: 'nft' | 'token' | 'item';
  game: string;
  value: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats?: {
    power?: number;
    defense?: number;
    speed?: number;
  };
  earnings?: string;
  isStaked?: boolean;
}

interface GameStats {
  totalValue: string;
  activeGames: number;
  nftCount: number;
  dailyEarnings: string;
  topPerformer: string;
}

interface GameFiIntegrationProps {
  walletAddress?: string;
  selectedGame?: string;
}

const GameFiIntegration: React.FC<GameFiIntegrationProps> = ({
  walletAddress,
  selectedGame = 'all'
}) => {
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showStakingOptions, setShowStakingOptions] = useState(false);

  // Mock GameFi data
  const mockGameAssets: GameAsset[] = [
    {
      id: '1',
      name: 'Dragon Sword of Power',
      type: 'nft',
      game: 'NEAR Warriors',
      value: '45.2 NEAR',
      rarity: 'legendary',
      stats: { power: 95, defense: 40, speed: 70 },
      earnings: '2.1 NEAR/day',
      isStaked: true
    },
    {
      id: '2',
      name: 'Mystic Shield',
      type: 'nft',
      game: 'NEAR Warriors',
      value: '28.7 NEAR',
      rarity: 'epic',
      stats: { power: 30, defense: 90, speed: 20 },
      earnings: '1.5 NEAR/day',
      isStaked: false
    },
    {
      id: '3',
      name: 'COMBAT Tokens',
      type: 'token',
      game: 'Battle Arena',
      value: '156.8 COMBAT',
      rarity: 'common',
      earnings: '5.2 COMBAT/day',
      isStaked: true
    },
    {
      id: '4',
      name: 'Legendary Pet Dragon',
      type: 'nft',
      game: 'Pet Universe',
      value: '67.4 NEAR',
      rarity: 'legendary',
      stats: { power: 85, defense: 60, speed: 95 },
      earnings: '3.2 NEAR/day',
      isStaked: true
    },
    {
      id: '5',
      name: 'Racing Car NFT',
      type: 'nft',
      game: 'Speed Racers',
      value: '23.1 NEAR',
      rarity: 'rare',
      stats: { speed: 100 },
      earnings: '1.8 NEAR/day',
      isStaked: false
    }
  ];

  const mockGameStats: GameStats = {
    totalValue: '321.2 NEAR',
    activeGames: 4,
    nftCount: 15,
    dailyEarnings: '13.8 NEAR',
    topPerformer: 'NEAR Warriors'
  };

  useEffect(() => {
    const loadGameData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGameAssets(mockGameAssets);
      setGameStats(mockGameStats);
      setLoading(false);
    };

    loadGameData();
  }, [walletAddress]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/50';
      case 'epic': return 'border-purple-400 shadow-purple-400/50';
      case 'rare': return 'border-blue-400 shadow-blue-400/50';
      default: return 'border-gray-400 shadow-gray-400/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nft': return <Trophy className="w-5 h-5" />;
      case 'token': return <Coins className="w-5 h-5" />;
      case 'item': return <Sword className="w-5 h-5" />;
      default: return <Gamepad2 className="w-5 h-5" />;
    }
  };

  const filteredAssets = gameAssets.filter(asset => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'staked') return asset.isStaked;
    if (selectedCategory === 'unstaked') return !asset.isStaked;
    return asset.type === selectedCategory;
  });

  const stakeAsset = async (assetId: string) => {
    setGameAssets(prev => 
      prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, isStaked: !asset.isStaked }
          : asset
      )
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-700 rounded"></div>
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
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold">GameFi Portfolio</h3>
          <span className="px-2 py-1 bg-purple-400/20 text-purple-400 text-sm rounded-full">
            Web3 Gaming
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStakingOptions(!showStakingOptions)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>Manage Stakes</span>
        </motion.button>
      </div>

      {/* Stats Overview */}
      {gameStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Total Value</span>
            </div>
            <div className="text-xl font-bold text-yellow-400">{gameStats.totalValue}</div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Active Games</span>
            </div>
            <div className="text-xl font-bold text-blue-400">{gameStats.activeGames}</div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">NFT Assets</span>
            </div>
            <div className="text-xl font-bold text-purple-400">{gameStats.nftCount}</div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Daily Earnings</span>
            </div>
            <div className="text-xl font-bold text-green-400">{gameStats.dailyEarnings}</div>
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
        <span className="text-sm text-gray-400 whitespace-nowrap">Filter:</span>
        <div className="flex space-x-1">
          {['all', 'nft', 'token', 'staked', 'unstaked'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-700/50 rounded-lg p-4 border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${getRarityBorder(asset.rarity)}`}
            >
              {/* Asset Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(asset.type)}
                  <span className="text-xs text-gray-400 uppercase">{asset.type}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getRarityColor(asset.rarity)}`}>
                  {asset.rarity}
                </div>
              </div>

              {/* Asset Name & Game */}
              <h4 className="font-semibold text-lg mb-1">{asset.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{asset.game}</p>

              {/* Stats */}
              {asset.stats && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {asset.stats.power && (
                    <div className="text-center">
                      <Sword className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Power</div>
                      <div className="text-sm font-bold text-red-400">{asset.stats.power}</div>
                    </div>
                  )}
                  {asset.stats.defense && (
                    <div className="text-center">
                      <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Defense</div>
                      <div className="text-sm font-bold text-blue-400">{asset.stats.defense}</div>
                    </div>
                  )}
                  {asset.stats.speed && (
                    <div className="text-center">
                      <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">Speed</div>
                      <div className="text-sm font-bold text-yellow-400">{asset.stats.speed}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Value & Earnings */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Value:</span>
                  <span className="font-semibold text-green-400">{asset.value}</span>
                </div>
                {asset.earnings && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Earnings:</span>
                    <span className="font-semibold text-yellow-400">{asset.earnings}</span>
                  </div>
                )}
              </div>

              {/* Staking Status & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${asset.isStaked ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-400">
                    {asset.isStaked ? 'Staked' : 'Available'}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => stakeAsset(asset.id)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    asset.isStaked
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {asset.isStaked ? 'Unstake' : 'Stake'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Game Assets Found</h4>
          <p className="text-sm text-gray-500">
            {selectedCategory === 'all' 
              ? 'Connect your wallet to view your GameFi portfolio'
              : `No ${selectedCategory} assets found. Try a different filter.`
            }
          </p>
        </div>
      )}

      {/* Gaming Tips */}
      <div className="mt-8 p-4 bg-purple-400/10 border border-purple-400/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Trophy className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-purple-400 font-medium">GameFi Optimization Tips</p>
            <ul className="text-gray-300 mt-2 space-y-1">
              <li>• Stake high-value NFTs for maximum daily earnings</li>
              <li>• Diversify across multiple games to reduce risk</li>
              <li>• Monitor asset performance and market trends</li>
              <li>• Participate in game events for bonus rewards</li>
              <li>• Consider asset upgrading for better stats</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameFiIntegration; 