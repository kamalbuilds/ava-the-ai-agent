"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Wallet, Bitcoin, Zap, Link, ArrowRight } from 'lucide-react';

const NearIntegrationPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeChain, setActiveChain] = useState('near');
  
  const chains = [
    { id: 'near', name: 'NEAR Protocol', color: 'green', icon: Link },
    { id: 'bitcoin', name: 'Bitcoin', color: 'orange', icon: Bitcoin },
    { id: 'ethereum', name: 'Ethereum', color: 'blue', icon: Zap }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

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
              <h1 className="text-2xl font-bold">AVA Near AI Agent</h1>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className={`px-4 py-2 rounded-full border-2 ${
                isConnected 
                  ? 'border-green-400 bg-green-400/10 text-green-400' 
                  : 'border-red-400 bg-red-400/10 text-red-400'
              }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.section 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
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
            CHAIN_ABSTRACTION
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Multi-chain AI agent powered by NEAR Protocol for seamless Bitcoin, Ethereum, and NEAR transactions
          </motion.p>
        </motion.section>

        {/* Chain Selection */}
        <motion.section 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">Select Blockchain</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chains.map((chain, index) => {
              const IconComponent = chain.icon;
              return (
                <motion.div
                  key={chain.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveChain(chain.id)}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    activeChain === chain.id
                      ? `border-${chain.color}-400 bg-${chain.color}-400/10`
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <IconComponent className={`w-12 h-12 text-${chain.color}-400`} />
                  </div>
                  <h4 className="text-xl font-semibold text-center mb-2">{chain.name}</h4>
                  <p className="text-gray-400 text-center text-sm">
                    {chain.id === 'near' && 'Fast, carbon-neutral blockchain'}
                    {chain.id === 'bitcoin' && 'Digital gold, store of value'}
                    {chain.id === 'ethereum' && 'Smart contracts platform'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">AI Agent Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                title: "Unified Wallet",
                description: "Manage all your multi-chain assets from a single interface",
                icon: Wallet
              },
              {
                title: "Real-time Monitoring",
                description: "Track your assets and transactions across all chains",
                icon: Terminal
              },
              {
                title: "DeFi Integration",
                description: "Access yield farming, staking, and trading opportunities",
                icon: Link
              },
              {
                title: "Security First",
                description: "Military-grade encryption and secure key management",
                icon: Terminal
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

        {/* CTA Section */}
        <motion.section 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsConnected(!isConnected)}
            className="bg-gradient-to-r from-green-400 to-blue-400 text-black px-8 py-4 rounded-lg text-lg font-bold hover:shadow-lg hover:shadow-green-400/25 transition-all duration-300"
          >
            {isConnected ? 'Launch AI Agent' : 'Connect Wallet'}
          </motion.button>
        </motion.section>
      </main>
    </div>
  );
};

export default NearIntegrationPage; 