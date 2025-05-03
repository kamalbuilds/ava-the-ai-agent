"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';

interface TransactionBuilderProps {
  selectedChain: 'near' | 'ethereum' | 'bitcoin';
  onTransactionCreated?: (transaction: any) => void;
}

interface TransactionForm {
  to: string;
  amount: string;
  gasPrice?: string;
  gasLimit?: string;
  memo?: string;
}

const TransactionBuilder: React.FC<TransactionBuilderProps> = ({ 
  selectedChain, 
  onTransactionCreated 
}) => {
  const [form, setForm] = useState<TransactionForm>({
    to: '',
    amount: '',
    gasPrice: '',
    gasLimit: '',
    memo: ''
  });

  const [estimating, setEstimating] = useState(false);
  const [estimated, setEstimated] = useState<any>(null);
  const [building, setBuilding] = useState(false);

  const chainConfig = {
    near: {
      symbol: 'NEAR',
      addressPlaceholder: 'example.near',
      requiresGas: false,
      supportsGasPrice: false,
      supportsMemo: true
    },
    ethereum: {
      symbol: 'ETH',
      addressPlaceholder: '0x742d35Cc6634C0532925a3b8D404d...',
      requiresGas: true,
      supportsGasPrice: true,
      supportsMemo: false
    },
    bitcoin: {
      symbol: 'BTC',
      addressPlaceholder: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      requiresGas: false,
      supportsGasPrice: false,
      supportsMemo: false
    }
  };

  const config = chainConfig[selectedChain];

  const handleInputChange = (field: keyof TransactionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setEstimated(null); // Reset estimation when form changes
  };

  const estimateTransaction = async () => {
    if (!form.to || !form.amount) return;

    setEstimating(true);
    try {
      // Simulate API call to estimate transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockEstimation = {
        fee: selectedChain === 'near' ? '0.001' :
             selectedChain === 'ethereum' ? '0.002' : '0.00005',
        total: (parseFloat(form.amount) + parseFloat(
          selectedChain === 'near' ? '0.001' :
          selectedChain === 'ethereum' ? '0.002' : '0.00005'
        )).toString(),
        gasLimit: selectedChain === 'ethereum' ? '21000' : undefined,
        gasPrice: selectedChain === 'ethereum' ? '20' : undefined
      };

      setEstimated(mockEstimation);
    } catch (error) {
      console.error('Estimation failed:', error);
    } finally {
      setEstimating(false);
    }
  };

  const buildTransaction = async () => {
    setBuilding(true);
    try {
      // Simulate transaction building
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transaction = {
        chain: selectedChain,
        to: form.to,
        amount: form.amount,
        gasPrice: form.gasPrice,
        gasLimit: form.gasLimit,
        memo: form.memo,
        estimated
      };

      onTransactionCreated?.(transaction);
    } catch (error) {
      console.error('Transaction building failed:', error);
    } finally {
      setBuilding(false);
    }
  };

  const isFormValid = form.to && form.amount && parseFloat(form.amount) > 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Send className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Transaction Builder</h3>
        <span className="px-2 py-1 bg-blue-400/20 text-blue-400 text-xs rounded-full uppercase">
          {selectedChain}
        </span>
      </div>

      <div className="space-y-4">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={form.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            placeholder={config.addressPlaceholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount ({config.symbol})
          </label>
          <input
            type="number"
            step="any"
            value={form.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Gas Price (Ethereum only) */}
        {config.supportsGasPrice && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Gas Price (Gwei) - Optional
            </label>
            <input
              type="number"
              value={form.gasPrice}
              onChange={(e) => handleInputChange('gasPrice', e.target.value)}
              placeholder="20"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
        )}

        {/* Gas Limit (Ethereum only) */}
        {config.requiresGas && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Gas Limit - Optional
            </label>
            <input
              type="number"
              value={form.gasLimit}
              onChange={(e) => handleInputChange('gasLimit', e.target.value)}
              placeholder="21000"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
        )}

        {/* Memo (NEAR only) */}
        {config.supportsMemo && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Memo - Optional
            </label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              placeholder="Transaction memo"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
        )}

        {/* Estimate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={estimateTransaction}
          disabled={!isFormValid || estimating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <Calculator className={`w-5 h-5 ${estimating ? 'animate-spin' : ''}`} />
          <span>{estimating ? 'Estimating...' : 'Estimate Transaction'}</span>
        </motion.button>

        {/* Estimation Results */}
        {estimated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-400/10 border border-green-400/30 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Estimation Complete</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span>{form.amount} {config.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee:</span>
                <span>{estimated.fee} {config.symbol}</span>
              </div>
              {estimated.gasPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Gas Price:</span>
                  <span>{estimated.gasPrice} Gwei</span>
                </div>
              )}
              {estimated.gasLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Gas Limit:</span>
                  <span>{estimated.gasLimit}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-600 pt-2 font-semibold">
                <span>Total:</span>
                <span>{estimated.total} {config.symbol}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Build Transaction Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={buildTransaction}
          disabled={!estimated || building}
          className="w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-black py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
        >
          <Send className={`w-5 h-5 ${building ? 'animate-pulse' : ''}`} />
          <span>{building ? 'Building Transaction...' : 'Build Transaction'}</span>
        </motion.button>

        {/* Warning */}
        {isFormValid && !estimated && (
          <div className="flex items-start space-x-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Please estimate the transaction before building to ensure you have sufficient balance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionBuilder; 