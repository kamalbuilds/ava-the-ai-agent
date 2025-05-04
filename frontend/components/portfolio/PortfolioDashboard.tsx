"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface PortfolioData {
  totalValue: string;
  change24h: string;
  changePercent: string;
  assets: AssetBalance[];
}

interface AssetBalance {
  chain: string;
  symbol: string;
  balance: string;
  usdValue: string;
  change24h: string;
  icon: string;
}

const PortfolioDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock portfolio data
  const mockPortfolio: PortfolioData = {
    totalValue: "2,847.32",
    change24h: "+127.45",
    changePercent: "+4.69",
    assets: [
      {
        chain: "near",
        symbol: "NEAR",
        balance: "100.0",
        usdValue: "450.00",
        change24h: "+2.3",
        icon: "🔗"
      },
      {
        chain: "ethereum",
        symbol: "ETH",
        balance: "1.5",
        usdValue: "2,250.00",
        change24h: "+5.2",
        icon: "⚡"
      },
      {
        chain: "bitcoin",
        symbol: "BTC",
        balance: "0.01",
        usdValue: "147.32",
        change24h: "+1.8",
        icon: "₿"
      }
    ]
  };

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPortfolio(mockPortfolio);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPortfolio(mockPortfolio);
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-8 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">
          Failed to load portfolio data
        </div>
      </div>
    );
  }

  const isPositiveChange = portfolio.changePercent.startsWith('+');

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold">Portfolio Overview</h3>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshPortfolio}
          disabled={refreshing}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Total Value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-3xl font-bold mb-2">
          ${portfolio.totalValue}
        </div>
        <div className="flex items-center space-x-2">
          {isPositiveChange ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.change24h} ({portfolio.changePercent}%) 24h
          </span>
        </div>
      </motion.div>

      {/* Assets List */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold mb-3">Assets</h4>
        {portfolio.assets.map((asset, index) => (
          <motion.div
            key={asset.chain}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{asset.icon}</div>
                <div>
                  <div className="font-semibold">{asset.symbol}</div>
                  <div className="text-sm text-gray-400 capitalize">{asset.chain}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">${asset.usdValue}</div>
                <div className="text-sm text-gray-400">{asset.balance} {asset.symbol}</div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  asset.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {asset.change24h}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <DollarSign className="w-5 h-5" />
          <span>Buy</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Trade</span>
        </motion.button>
      </div>

      {/* Portfolio Allocation Chart Placeholder */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
        <h5 className="text-sm font-medium mb-3">Asset Allocation</h5>
        <div className="space-y-2">
          {portfolio.assets.map((asset) => {
            const percentage = ((parseFloat(asset.usdValue) / parseFloat(portfolio.totalValue.replace(',', ''))) * 100).toFixed(1);
            return (
              <div key={asset.chain} className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>{asset.icon}</span>
                  <span>{asset.symbol}</span>
                </span>
                <span className="text-gray-400">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboard; 