"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from '@/components/wallet/WalletConnect';
import TransactionBuilder from '@/components/transaction/TransactionBuilder';
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';
import AIChat from '@/components/ai/AIChat';
import { useNearIntegration } from '@/hooks/useNearIntegration';

export default function DashboardPage() {
  const [connectedWallet, setConnectedWallet] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<'near' | 'ethereum' | 'bitcoin'>('near');
  const nearIntegration = useNearIntegration();

  const handleWalletConnect = async (wallet: any) => {
    setConnectedWallet(wallet);
    setSelectedChain(wallet.chain);
    
    // Initialize NEAR integration
    await nearIntegration.initialize();
    
    // Generate addresses for the connected chain
    if (wallet.chain === 'near') {
      await nearIntegration.generateAddresses('near-1');
    }
  };

  const handleWalletDisconnect = () => {
    setConnectedWallet(null);
    nearIntegration.disconnect();
  };

  const handleTransactionCreated = (transaction: any) => {
    console.log('Transaction created:', transaction);
    // Here you could show a success message or redirect to transaction status
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Background Effects */}
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
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">AVA Portfolio Manager</h1>
                <p className="text-sm text-gray-400">Multi-Chain AI Agent Dashboard</p>
              </div>
            </motion.div>
            
            {/* Connection Status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-4"
            >
              {connectedWallet && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-400/10 border border-green-400/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">
                    {connectedWallet.address} on {connectedWallet.chain}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet & Transaction */}
          <motion.div 
            {...fadeInUp}
            className="space-y-6"
          >
            {/* Wallet Connection */}
            <WalletConnect 
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />

            {/* Transaction Builder */}
            {connectedWallet && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <TransactionBuilder
                  selectedChain={selectedChain}
                  onTransactionCreated={handleTransactionCreated}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Middle Column - Portfolio Dashboard */}
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            {connectedWallet ? (
              <PortfolioDashboard />
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 text-center">
                <div className="text-gray-400 mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Portfolio Dashboard</h3>
                  <p className="text-sm">Connect your wallet to view your multi-chain portfolio</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column - AI Chat */}
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <AIChat 
              walletConnected={!!connectedWallet}
              currentChain={selectedChain}
            />
          </motion.div>
        </div>

        {/* Bottom Section - Features Overview */}
        {!connectedWallet && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Next-Generation Portfolio Management
                </span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Harness the power of AI and blockchain technology to manage your crypto portfolio 
                across NEAR, Bitcoin, and Ethereum with intelligent insights and automated optimization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🔗",
                  title: "Multi-Chain Support",
                  description: "Seamlessly manage assets across NEAR, Bitcoin, and Ethereum"
                },
                {
                  icon: "🤖",
                  title: "AI-Powered Insights",
                  description: "Get intelligent recommendations for transactions and portfolio optimization"
                },
                {
                  icon: "⚡",
                  title: "Gas Optimization",
                  description: "Minimize transaction costs with smart gas fee management"
                },
                {
                  icon: "🛡️",
                  title: "Secure & Private",
                  description: "Your keys, your crypto. We never store your private information"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 text-center hover:border-green-400/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-12"
            >
              <p className="text-gray-400 mb-6">
                Ready to revolutionize your crypto portfolio management?
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <div className="bg-gradient-to-r from-green-400 to-blue-400 text-black px-8 py-4 rounded-lg text-lg font-bold hover:shadow-lg hover:shadow-green-400/25 transition-all duration-300 cursor-pointer">
                  Connect Your Wallet to Get Started
                </div>
              </motion.div>
            </motion.div>
          </motion.section>
        )}

        {/* Connected State - Additional Features */}
        {connectedWallet && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "DeFi Opportunities",
                  description: "Discover yield farming and staking opportunities",
                  action: "Explore DeFi",
                  color: "blue"
                },
                {
                  title: "Trading Signals",
                  description: "Get AI-powered trading recommendations",
                  action: "View Signals",
                  color: "green"
                },
                {
                  title: "Risk Analysis",
                  description: "Assess portfolio risk and diversification",
                  action: "Analyze Risk",
                  color: "purple"
                }
              ].map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-all duration-300 cursor-pointer"
                >
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{card.description}</p>
                  <div className={`inline-block px-4 py-2 bg-${card.color}-600 hover:bg-${card.color}-700 rounded-lg text-sm font-medium transition-colors`}>
                    {card.action}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="relative z-10 border-t border-gray-700 mt-16"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">
              Built with ❤️ for the multi-chain future
            </p>
            <p className="text-sm">
              Powered by NEAR Protocol, Bitcoin, and Ethereum
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
} 