"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';

interface WalletConnectProps {
  onConnect?: (wallet: any) => void;
  onDisconnect?: () => void;
}

interface WalletState {
  connected: boolean;
  connecting: boolean;
  address?: string;
  chain?: string;
  error?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false
  });

  const [selectedChain, setSelectedChain] = useState<'near' | 'ethereum' | 'bitcoin'>('near');

  const chains = [
    { id: 'near', name: 'NEAR', color: 'green' },
    { id: 'ethereum', name: 'Ethereum', color: 'blue' },
    { id: 'bitcoin', name: 'Bitcoin', color: 'orange' }
  ];

  const connectWallet = async () => {
    const { error, ...stateWithoutError } = walletState;
    setWalletState({ 
      ...stateWithoutError, 
      connecting: true
    });
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockWallet = {
        address: selectedChain === 'near' ? 'example.near' : 
                selectedChain === 'ethereum' ? '0x742d35Cc6634C0532925a3b8D404d' :
                'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        chain: selectedChain,
        balance: selectedChain === 'near' ? '100.0' :
                selectedChain === 'ethereum' ? '1.5' : '0.01'
      };

      setWalletState({
        connected: true,
        connecting: false,
        address: mockWallet.address,
        chain: selectedChain
      });

      onConnect?.(mockWallet);
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to connect wallet'
      }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      connected: false,
      connecting: false
    });
    onDisconnect?.();
  };

  const formatAddress = (address: string) => {
    if (address.includes('.near')) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Wallet className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold">Wallet Connection</h3>
        </div>
        
        {walletState.connected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 text-green-400"
          >
            <Check className="w-5 h-5" />
            <span className="text-sm">Connected</span>
          </motion.div>
        )}
      </div>

      {!walletState.connected ? (
        <div className="space-y-4">
          {/* Chain Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Chain</label>
            <div className="grid grid-cols-3 gap-2">
              {chains.map((chain) => (
                <motion.button
                  key={chain.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChain(chain.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedChain === chain.id
                      ? `border-${chain.color}-400 bg-${chain.color}-400/10`
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-medium">{chain.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={connectWallet}
            disabled={walletState.connecting}
            className="w-full bg-gradient-to-r from-green-400 to-blue-400 text-black py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {walletState.connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Connect {chains.find(c => c.id === selectedChain)?.name} Wallet</span>
              </>
            )}
          </motion.button>

          {walletState.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{walletState.error}</span>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Wallet Info */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Address</span>
              <span className="text-sm font-mono">{formatAddress(walletState.address!)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Chain</span>
              <span className="text-sm capitalize">{walletState.chain}</span>
            </div>
          </div>

          {/* Disconnect Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={disconnectWallet}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Disconnect Wallet
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 