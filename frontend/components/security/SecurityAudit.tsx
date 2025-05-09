"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, Lock, Zap, Bug } from 'lucide-react';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  autoFix?: boolean;
  checked: boolean;
}

interface SecurityScore {
  overall: number;
  categories: {
    wallet: number;
    transaction: number;
    protocol: number;
    privacy: number;
  };
}

interface SecurityAuditProps {
  walletAddress?: string;
  chain?: string;
  autoRun?: boolean;
}

const SecurityAudit: React.FC<SecurityAuditProps> = ({
  walletAddress,
  chain = 'near',
  autoRun = true
}) => {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Mock security checks data
  const mockSecurityChecks: SecurityCheck[] = [
    {
      id: 'wallet-encryption',
      name: 'Wallet Encryption Check',
      status: 'passed',
      severity: 'critical',
      description: 'Verify wallet private keys are properly encrypted',
      recommendation: 'Wallet encryption is properly implemented',
      checked: true
    },
    {
      id: 'transaction-signing',
      name: 'Transaction Signing Verification',
      status: 'passed',
      severity: 'high',
      description: 'Ensure all transactions are properly signed before broadcast',
      recommendation: 'Transaction signing mechanism is secure',
      checked: true
    },
    {
      id: 'rpc-security',
      name: 'RPC Endpoint Security',
      status: 'warning',
      severity: 'medium',
      description: 'Check if RPC endpoints use secure HTTPS connections',
      recommendation: 'Consider using verified RPC endpoints with SSL certificates',
      autoFix: true,
      checked: true
    },
    {
      id: 'smart-contract-audit',
      name: 'Smart Contract Verification',
      status: 'passed',
      severity: 'high',
      description: 'Verify smart contracts are audited and verified',
      recommendation: 'Only interact with audited smart contracts',
      checked: true
    },
    {
      id: 'phishing-protection',
      name: 'Phishing Protection',
      status: 'passed',
      severity: 'high',
      description: 'Check for phishing protection mechanisms',
      recommendation: 'Domain verification and URL checking are active',
      checked: true
    },
    {
      id: 'gas-limit-check',
      name: 'Gas Limit Validation',
      status: 'warning',
      severity: 'medium',
      description: 'Validate gas limits to prevent overpayment',
      recommendation: 'Implement gas limit warnings for unusual transactions',
      autoFix: true,
      checked: true
    },
    {
      id: 'private-key-exposure',
      name: 'Private Key Exposure Check',
      status: 'passed',
      severity: 'critical',
      description: 'Scan for potential private key leaks',
      recommendation: 'No private key exposure detected',
      checked: true
    },
    {
      id: 'network-security',
      name: 'Network Security Analysis',
      status: 'failed',
      severity: 'medium',
      description: 'Check network connection security',
      recommendation: 'Use VPN or secure network connections when possible',
      autoFix: false,
      checked: true
    }
  ];

  const mockSecurityScore: SecurityScore = {
    overall: 85,
    categories: {
      wallet: 95,
      transaction: 90,
      protocol: 80,
      privacy: 75
    }
  };

  useEffect(() => {
    if (autoRun) {
      runSecurityAudit();
    }
  }, [autoRun, walletAddress]);

  const runSecurityAudit = async () => {
    setIsAuditing(true);
    
    // Simulate progressive checking
    for (let i = 0; i < mockSecurityChecks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const check = mockSecurityChecks[i];
      if (check) {
        setSecurityChecks(prev => [...prev, check]);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setSecurityScore(mockSecurityScore);
    setIsAuditing(false);
  };

  const autoFixIssue = async (checkId: string) => {
    setSecurityChecks(prev => 
      prev.map(check => 
        check.id === checkId 
          ? { ...check, status: 'pending' as const }
          : check
      )
    );

    // Simulate auto-fix process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSecurityChecks(prev => 
      prev.map(check => 
        check.id === checkId 
          ? { ...check, status: 'passed' as const }
          : check
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredChecks = selectedCategory === 'all' 
    ? securityChecks 
    : securityChecks.filter(check => {
        switch (selectedCategory) {
          case 'wallet': return ['wallet-encryption', 'private-key-exposure'].includes(check.id);
          case 'transaction': return ['transaction-signing', 'gas-limit-check'].includes(check.id);
          case 'protocol': return ['smart-contract-audit', 'rpc-security'].includes(check.id);
          case 'privacy': return ['phishing-protection', 'network-security'].includes(check.id);
          default: return true;
        }
      });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Security Audit</h3>
          {walletAddress && (
            <span className="px-2 py-1 bg-blue-400/20 text-blue-400 text-sm rounded-full">
              {chain.toUpperCase()}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={runSecurityAudit}
          disabled={isAuditing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          <Zap className={`w-4 h-4 ${isAuditing ? 'animate-pulse' : ''}`} />
          <span>{isAuditing ? 'Auditing...' : 'Run Audit'}</span>
        </motion.button>
      </div>

      {/* Security Score Overview */}
      {securityScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Security Score</h4>
            <div className={`text-3xl font-bold ${getScoreColor(securityScore.overall)}`}>
              {securityScore.overall}/100
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(securityScore.categories).map(([category, score]) => (
              <div key={category} className="text-center">
                <div className="text-sm text-gray-400 capitalize mb-1">{category}</div>
                <div className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      score >= 90 ? 'bg-green-400' :
                      score >= 75 ? 'bg-yellow-400' :
                      score >= 60 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-sm text-gray-400">Filter by category:</span>
        <div className="flex space-x-1">
          {['all', 'wallet', 'transaction', 'protocol', 'privacy'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Security Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Security Checks</h4>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showRecommendations ? 'Hide' : 'Show'} Recommendations
          </button>
        </div>

        <AnimatePresence>
          {filteredChecks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold">{check.name}</h5>
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(check.severity)}`}></div>
                      <span className="text-xs text-gray-400 uppercase">{check.severity}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{check.description}</p>
                    
                    {showRecommendations && (
                      <div className="text-sm text-blue-300 bg-blue-400/10 rounded p-2">
                        💡 {check.recommendation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-fix button */}
                {check.autoFix && check.status === 'warning' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => autoFixIssue(check.id)}
                    className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-colors"
                  >
                    Auto Fix
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {isAuditing && securityChecks.length === 0 && (
        <div className="text-center py-8">
          <Bug className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <h4 className="text-lg font-semibold text-blue-400 mb-2">Running Security Audit</h4>
          <p className="text-sm text-gray-400">Analyzing your wallet and transaction security...</p>
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-blue-400/10 border border-blue-400/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-400 font-medium">Security Best Practices</p>
            <ul className="text-gray-300 mt-2 space-y-1">
              <li>• Never share your private keys or seed phrases</li>
              <li>• Always verify smart contract addresses before interacting</li>
              <li>• Use hardware wallets for large amounts</li>
              <li>• Keep your software updated</li>
              <li>• Be cautious of phishing attempts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Eye className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="text-xs text-gray-400">
            <p>Security audits are performed locally. No private information is transmitted to external servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit; 