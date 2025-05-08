"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target, AlertTriangle } from 'lucide-react';

interface TechnicalIndicator {
  name: string;
  value: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  description: string;
}

interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  volume: string;
  marketCap: string;
  indicators: TechnicalIndicator[];
  support: string;
  resistance: string;
  rsi: number;
  macd: { value: string; signal: 'bullish' | 'bearish' };
}

interface TechnicalAnalysisProps {
  symbol?: string;
  timeframe?: '1h' | '4h' | '1d' | '1w';
  onTimeframeChange?: (timeframe: string) => void;
}

const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({
  symbol = 'NEAR',
  timeframe = '1d',
  onTimeframeChange
}) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);

  // Mock market data
  const mockData: MarketData = {
    symbol,
    price: symbol === 'NEAR' ? '4.52' : symbol === 'ETH' ? '2,345.67' : '43,210.98',
    change24h: '+2.34%',
    volume: '12.5M',
    marketCap: '1.2B',
    support: symbol === 'NEAR' ? '4.20' : symbol === 'ETH' ? '2,200.00' : '42,000.00',
    resistance: symbol === 'NEAR' ? '4.80' : symbol === 'ETH' ? '2,500.00' : '45,000.00',
    rsi: 65.4,
    macd: { value: '+0.05', signal: 'bullish' },
    indicators: [
      {
        name: 'RSI (14)',
        value: '65.4',
        signal: 'buy',
        strength: 75,
        description: 'Relative Strength Index indicates bullish momentum'
      },
      {
        name: 'MACD',
        value: '+0.05',
        signal: 'buy',
        strength: 80,
        description: 'MACD line crossed above signal line - bullish crossover'
      },
      {
        name: 'SMA (50)',
        value: '4.38',
        signal: 'buy',
        strength: 70,
        description: 'Price above 50-day Simple Moving Average'
      },
      {
        name: 'Bollinger Bands',
        value: 'Upper Band',
        signal: 'neutral',
        strength: 60,
        description: 'Price approaching upper Bollinger Band'
      },
      {
        name: 'Stochastic',
        value: '72.3',
        signal: 'buy',
        strength: 65,
        description: 'Stochastic oscillator in bullish territory'
      },
      {
        name: 'Volume',
        value: 'Above Average',
        signal: 'buy',
        strength: 85,
        description: 'Trading volume 25% above average - strong interest'
      }
    ]
  };

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMarketData(mockData);
      setLoading(false);
    };

    loadMarketData();
  }, [symbol, timeframe]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="w-4 h-4" />;
      case 'sell': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const timeframes = ['1h', '4h', '1d', '1w'];

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) return null;

  const bullishSignals = marketData.indicators.filter(i => i.signal === 'buy').length;
  const bearishSignals = marketData.indicators.filter(i => i.signal === 'sell').length;
  const overallSentiment = bullishSignals > bearishSignals ? 'bullish' : 
                          bearishSignals > bullishSignals ? 'bearish' : 'neutral';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Technical Analysis</h3>
          <span className="px-2 py-1 bg-blue-400/20 text-blue-400 text-sm rounded-full">
            {marketData.symbol}
          </span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Price</div>
          <div className="text-lg font-bold">${marketData.price}</div>
          <div className="text-sm text-green-400">{marketData.change24h}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Volume</div>
          <div className="text-lg font-bold">${marketData.volume}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Support</div>
          <div className="text-lg font-bold text-green-400">${marketData.support}</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Resistance</div>
          <div className="text-lg font-bold text-red-400">${marketData.resistance}</div>
        </div>
      </motion.div>

      {/* Overall Sentiment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`p-4 rounded-lg border-2 mb-6 ${
          overallSentiment === 'bullish' ? 'border-green-400/30 bg-green-400/10' :
          overallSentiment === 'bearish' ? 'border-red-400/30 bg-red-400/10' :
          'border-yellow-400/30 bg-yellow-400/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className={`w-6 h-6 ${
              overallSentiment === 'bullish' ? 'text-green-400' :
              overallSentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <div>
              <h4 className="font-semibold capitalize">{overallSentiment} Sentiment</h4>
              <p className="text-sm text-gray-400">
                {bullishSignals} bullish • {bearishSignals} bearish signals
              </p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            overallSentiment === 'bullish' ? 'text-green-400' :
            overallSentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {Math.round((bullishSignals / marketData.indicators.length) * 100)}%
          </div>
        </div>
      </motion.div>

      {/* Key Indicators */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Key Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">RSI (14)</span>
              <span className="font-semibold">{marketData.rsi}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${marketData.rsi}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {marketData.rsi > 70 ? 'Overbought' : marketData.rsi < 30 ? 'Oversold' : 'Neutral'}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">MACD</span>
              <span className={`font-semibold flex items-center space-x-1 ${
                marketData.macd.signal === 'bullish' ? 'text-green-400' : 'text-red-400'
              }`}>
                {getSignalIcon(marketData.macd.signal === 'bullish' ? 'buy' : 'sell')}
                <span>{marketData.macd.value}</span>
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1 capitalize">
              {marketData.macd.signal} crossover
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Technical Indicators</h4>
        <div className="space-y-3">
          {marketData.indicators.map((indicator, index) => (
            <motion.div
              key={indicator.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedIndicator(selectedIndicator === indicator.name ? null : indicator.name)}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${getSignalColor(indicator.signal)}`}>
                    {getSignalIcon(indicator.signal)}
                  </div>
                  <div>
                    <div className="font-semibold">{indicator.name}</div>
                    <div className="text-sm text-gray-400">{indicator.value}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium capitalize ${getSignalColor(indicator.signal)}`}>
                      {indicator.signal}
                    </div>
                    <div className="text-xs text-gray-400">
                      {indicator.strength}% strength
                    </div>
                  </div>
                  
                  {/* Strength Bar */}
                  <div className="w-16 bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        indicator.signal === 'buy' ? 'bg-green-400' :
                        indicator.signal === 'sell' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${indicator.strength}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Expanded Description */}
              {selectedIndicator === indicator.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-600"
                >
                  <p className="text-sm text-gray-300">{indicator.description}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Risk Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg"
      >
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-400 font-medium">Risk Disclaimer</p>
            <p className="text-gray-300 mt-1">
              Technical analysis is for informational purposes only. Past performance does not guarantee future results. 
              Always conduct your own research before making investment decisions.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TechnicalAnalysis; 