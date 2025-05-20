"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Cpu, 
  Wallet, 
  Bitcoin, 
  Zap, 
  Link, 
  ArrowRight, 
  DollarSign,
  TrendingUp,
  Shield,
  Settings,
  Send,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'transfer' | 'swap' | 'stake';
  chain: 'near' | 'bitcoin' | 'ethereum';
  amount: string;
  to: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  hash?: string;
}

interface Portfolio {
  totalValue: number;
  chains: {
    near: { balance: number; tokens: any[] };
    bitcoin: { balance: number; address: string };
    ethereum: { balance: number; tokens: any[] };
  };
}

interface AIAgent {
  status: 'active' | 'idle' | 'offline';
  mode: 'manual' | 'auto' | 'advisory';
  lastAction: string;
  recommendations: string[];
}

const NearAIAgentPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeChain, setActiveChain] = useState('near');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'agent', content: string, timestamp: Date}>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 0,
    chains: {
      near: { balance: 0, tokens: [] },
      bitcoin: { balance: 0, address: '' },
      ethereum: { balance: 0, tokens: [] }
    }
  });
  const [aiAgent, setAIAgent] = useState<AIAgent>({
    status: 'idle',
    mode: 'advisory',
    lastAction: 'Monitoring portfolio',
    recommendations: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const chains = [
    { id: 'near', name: 'NEAR Protocol', color: 'green', icon: Link },
    { id: 'bitcoin', name: 'Bitcoin', color: 'orange', icon: Bitcoin },
    { id: 'ethereum', name: 'Ethereum', color: 'blue', icon: Zap }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'chat', name: 'AI Chat', icon: Cpu },
    { id: 'transactions', name: 'Transactions', icon: Send },
    { id: 'portfolio', name: 'Portfolio', icon: Wallet },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  // Initialize portfolio data
  useEffect(() => {
    if (isConnected) {
      initializePortfolio();
      startAIAgent();
    }
  }, [isConnected]);

  const initializePortfolio = async () => {
    setIsLoading(true);
    try {
      // Simulate fetching real portfolio data
      const portfolioData = await fetchPortfolioData();
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Failed to initialize portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPortfolioData = async (): Promise<Portfolio> => {
    // In production, this would connect to real NEAR/Bitcoin/Ethereum APIs
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalValue: 12847.32,
          chains: {
            near: { 
              balance: 1250.5, 
              tokens: [
                { symbol: 'NEAR', amount: 1250.5, value: 3500.14 },
                { symbol: 'USDC.e', amount: 2000, value: 2000 }
              ]
            },
            bitcoin: { 
              balance: 0.1432, 
              address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
            },
            ethereum: { 
              balance: 2.5, 
              tokens: [
                { symbol: 'ETH', amount: 2.5, value: 5500.00 },
                { symbol: 'USDC', amount: 1500, value: 1500 }
              ]
            }
          }
        });
      }, 1000);
    });
  };

  const startAIAgent = () => {
    setAIAgent(prev => ({
      ...prev,
      status: 'active',
      recommendations: [
        'Consider staking your NEAR tokens for 8-12% APY',
        'ETH gas fees are currently low - good time for transactions',
        'BTC is showing strong support at current levels'
      ]
    }));
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Process AI command
      const response = await processAICommand(chatInput);
      const agentMessage = {
        role: 'agent' as const,
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('AI processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAICommand = async (command: string): Promise<string> => {
    // Simulate AI processing
    return new Promise((resolve) => {
      setTimeout(() => {
        if (command.toLowerCase().includes('balance')) {
          resolve(`Your current balances are:
• NEAR: ${portfolio.chains.near.balance} NEAR (~$${(portfolio.chains.near.balance * 2.8).toFixed(2)})
• Bitcoin: ${portfolio.chains.bitcoin.balance} BTC (~$${(portfolio.chains.bitcoin.balance * 43000).toFixed(2)})
• Ethereum: ${portfolio.chains.ethereum.balance} ETH (~$${(portfolio.chains.ethereum.balance * 2200).toFixed(2)})`);
        } else if (command.toLowerCase().includes('transaction') || command.toLowerCase().includes('send')) {
          resolve('I can help you build a transaction. Please specify the amount, recipient, and chain. For example: "Send 10 NEAR to alice.near"');
        } else if (command.toLowerCase().includes('stake')) {
          resolve('NEAR staking is available with validators offering 8-12% APY. Would you like me to show available validators?');
        } else {
          resolve('I understand you want to work with blockchain transactions. I can help with transfers, staking, DeFi operations, and portfolio analysis. What would you like to do?');
        }
      }, 1500);
    });
  };

  const renderOverview = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Portfolio</p>
              <p className="text-2xl font-bold text-green-400">${portfolio.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-blue-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Chains</p>
              <p className="text-2xl font-bold text-blue-400">3</p>
            </div>
            <Link className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-orange-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">AI Agent Status</p>
              <p className="text-2xl font-bold text-orange-400 capitalize">{aiAgent.status}</p>
            </div>
            <Cpu className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">24h Change</p>
              <p className="text-2xl font-bold text-purple-400">+5.2%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-green-400/30">
        <h3 className="text-xl font-bold mb-4 text-green-400">AI Recommendations</h3>
        <div className="space-y-3">
          {aiAgent.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Cpu className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-gray-300">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderChat = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gray-800/50 rounded-lg border border-green-400/30 h-96 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-green-400">NEAR AI Agent Chat</h3>
          <p className="text-gray-400 text-sm">Ask me anything about your portfolio or blockchain operations</p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-green-400/20 text-green-100' 
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Ask about balances, send transactions, get recommendations..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
            <button
              onClick={handleChatSubmit}
              className="bg-green-400 text-black px-6 py-2 rounded-lg hover:bg-green-300 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white font-mono relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.1)_0%,_rgba(0,0,0,0.8)_80%)]" />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border-b border-green-400/30 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.05 }}
            >
              <Terminal className="w-8 h-8 text-green-400" />
              <h1 className="text-2xl font-bold">NEAR AI Agent</h1>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <motion.div
                className={`px-4 py-2 rounded-full border-2 ${
                  isConnected 
                    ? 'border-green-400 bg-green-400/10 text-green-400' 
                    : 'border-red-400 bg-red-400/10 text-red-400'
                }`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsConnected(!isConnected)}
                className="bg-gradient-to-r from-green-400 to-blue-400 text-black px-6 py-2 rounded-lg font-bold"
              >
                {isConnected ? 'Disconnect' : 'Connect Wallet'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {isConnected ? (
          <>
            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8 bg-gray-800/50 rounded-lg p-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                      selectedTab === tab.id
                        ? 'bg-green-400/20 text-green-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {selectedTab === 'overview' && renderOverview()}
                {selectedTab === 'chat' && renderChat()}
                {selectedTab === 'transactions' && (
                  <div className="text-center text-gray-400 py-12">
                    <Send className="w-12 h-12 mx-auto mb-4" />
                    <p>Transaction history will appear here</p>
                  </div>
                )}
                {selectedTab === 'portfolio' && (
                  <div className="text-center text-gray-400 py-12">
                    <Wallet className="w-12 h-12 mx-auto mb-4" />
                    <p>Detailed portfolio analytics coming soon</p>
                  </div>
                )}
                {selectedTab === 'settings' && (
                  <div className="text-center text-gray-400 py-12">
                    <Settings className="w-12 h-12 mx-auto mb-4" />
                    <p>Agent settings and preferences</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          /* Landing Section */
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear" 
              }}
            >
              MULTI_CHAIN_AI
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Advanced AI agent for seamless Bitcoin, Ethereum, and NEAR Protocol operations
            </motion.p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {[
                {
                  title: "Cross-Chain Transactions",
                  description: "Build and execute transactions across Bitcoin, Ethereum, and NEAR",
                  icon: ArrowRight
                },
                {
                  title: "AI-Powered Analysis",
                  description: "Get intelligent insights and recommendations for your portfolio",
                  icon: Cpu
                },
                {
                  title: "Unified Portfolio",
                  description: "Manage all your multi-chain assets from a single interface",
                  icon: Wallet
                },
                {
                  title: "Real-time Monitoring",
                  description: "Track your assets and transactions across all chains",
                  icon: Activity
                },
                {
                  title: "DeFi Integration",
                  description: "Access yield farming, staking, and trading opportunities",
                  icon: TrendingUp
                },
                {
                  title: "Security First",
                  description: "Military-grade encryption and secure key management",
                  icon: Shield
                }
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-6 rounded-lg border border-gray-600 bg-gray-800/50 hover:border-green-400/50 transition-all duration-300"
                  >
                    <IconComponent className="w-10 h-10 text-green-400 mb-4" />
                    <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                    <p className="text-gray-400">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default NearAIAgentPage; 