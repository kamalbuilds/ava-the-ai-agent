"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNearAgent } from '@/contexts/NearAgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Coins,
  Zap,
  FileText,
  Eye,
  TrendingUp
} from 'lucide-react';

interface Transaction {
  hash: string;
  blockHeight: number;
  timestamp: Date;
  type: 'transfer' | 'stake' | 'unstake' | 'swap' | 'defi' | 'call' | 'deploy';
  status: 'success' | 'failed' | 'pending';
  from: string;
  to: string;
  amount?: string;
  token?: string;
  gasUsed: string;
  gasFee: string;
  methodName?: string;
  args?: any;
  receipt?: any;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  successRate: number;
  mostUsedType: string;
}

const TransactionHistory: React.FC = () => {
  const { state, connectWallet } = useNearAgent();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TransactionStats | null>(null);

  useEffect(() => {
    if (state.isConnected) {
      loadTransactionHistory();
    }
  }, [state.isConnected]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedType, selectedStatus, dateRange]);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from NEAR indexer
      const mockTransactions: Transaction[] = [
        {
          hash: '7BFhLumVs8R74mB8JKZP5ckFVcMCL8jKnFV6KR2Qh1Jz',
          blockHeight: 123456789,
          timestamp: new Date('2025-05-24T10:30:00'),
          type: 'transfer',
          status: 'success',
          from: state.accountId || 'alice.near',
          to: 'bob.near',
          amount: '10.5',
          token: 'NEAR',
          gasUsed: '2500000000000',
          gasFee: '0.00025'
        },
        {
          hash: '8CGiMxvWt9S85nC9KLZQ6dlGWdNDM9kLnGW7LS3Ri2Ka',
          blockHeight: 123456788,
          timestamp: new Date('2025-05-24T09:15:00'),
          type: 'stake',
          status: 'success',
          from: state.accountId || 'alice.near',
          to: 'meta-pool.pool.near',
          amount: '500.0',
          token: 'NEAR',
          gasUsed: '5000000000000',
          gasFee: '0.0005',
          methodName: 'deposit_and_stake'
        },
        {
          hash: '9DHjNywXu0T96oD0LMZR7emHXeOEN0mMoHX8MT4Sj3Lb',
          blockHeight: 123456787,
          timestamp: new Date('2025-05-24T08:45:00'),
          type: 'swap',
          status: 'success',
          from: state.accountId || 'alice.near',
          to: 'v2.ref-finance.near',
          amount: '100.0',
          token: 'NEAR',
          gasUsed: '8000000000000',
          gasFee: '0.0008',
          methodName: 'swap'
        },
        {
          hash: '0EIkOzxYv1U07pE1NNAS8fnIYfPFO1nNpIY9NU5Tk4Mc',
          blockHeight: 123456786,
          timestamp: new Date('2025-05-23T18:20:00'),
          type: 'defi',
          status: 'success',
          from: state.accountId || 'alice.near',
          to: 'contract.main.burrow.near',
          amount: '200.0',
          token: 'NEAR',
          gasUsed: '12000000000000',
          gasFee: '0.0012',
          methodName: 'supply'
        },
        {
          hash: '1FJlPAyZw2V18qF2OOBR9goJZgQGP2oOpJZ0OV6Ul5Nd',
          blockHeight: 123456785,
          timestamp: new Date('2025-05-23T16:10:00'),
          type: 'transfer',
          status: 'failed',
          from: state.accountId || 'alice.near',
          to: 'charlie.near',
          amount: '50.0',
          token: 'NEAR',
          gasUsed: '0',
          gasFee: '0.0001'
        },
        {
          hash: '2GKmQBzaw3W29rG3PPCQ0hpKahRHQ3pPqKa1PW7Vm6Oe',
          blockHeight: 123456784,
          timestamp: new Date('2025-05-23T14:30:00'),
          type: 'call',
          status: 'success',
          from: state.accountId || 'alice.near',
          to: 'token.v2.ref-finance.near',
          gasUsed: '3000000000000',
          gasFee: '0.0003',
          methodName: 'ft_transfer'
        }
      ];

      setTransactions(mockTransactions);
      calculateStats(mockTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (txs: Transaction[]) => {
    const stats: TransactionStats = {
      totalTransactions: txs.length,
      totalVolume: txs
        .filter(tx => tx.amount && tx.status === 'success')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0),
      totalFees: txs.reduce((sum, tx) => sum + parseFloat(tx.gasFee), 0),
      successRate: (txs.filter(tx => tx.status === 'success').length / txs.length) * 100,
      mostUsedType: getMostUsedType(txs)
    };
    setStats(stats);
  };

  const getMostUsedType = (txs: Transaction[]): string => {
    const typeCounts = txs.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(typeCounts);
    if (entries.length === 0) return 'transfer';
    
    return entries.reduce((a, b) => 
      (typeCounts[a[0]] || 0) > (typeCounts[b[0]] || 0) ? a : b
    )[0];
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.methodName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === selectedStatus);
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      filtered = filtered.filter(tx => 
        tx.timestamp >= fromDate && tx.timestamp <= toDate
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'stake':
        return <Coins className="h-4 w-4 text-green-600" />;
      case 'unstake':
        return <ArrowDownLeft className="h-4 w-4 text-orange-600" />;
      case 'swap':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      case 'defi':
        return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      case 'call':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Hash', 'Type', 'Status', 'From', 'To', 'Amount', 'Token', 'Gas Fee', 'Timestamp'].join(','),
      ...filteredTransactions.map(tx => [
        tx.hash,
        tx.type,
        tx.status,
        tx.from,
        tx.to,
        tx.amount || '',
        tx.token || '',
        tx.gasFee,
        tx.timestamp.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'near_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!state.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <History className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 mb-6">Connect your NEAR wallet to view transaction history</p>
        <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <History className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} NEAR</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Fees</p>
                  <p className="text-2xl font-bold">{stats.totalFees.toFixed(4)} NEAR</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportTransactions}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTransactionHistory}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="stake">Stake</option>
              <option value="unstake">Unstake</option>
              <option value="swap">Swap</option>
              <option value="defi">DeFi</option>
              <option value="call">Function Call</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              placeholder="From date"
            />

            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              placeholder="To date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.hash}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTransaction(tx)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(tx.type)}
                        {getStatusIcon(tx.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold capitalize">{tx.type}</h3>
                          <Badge variant="outline" className="text-xs">
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {tx.from} → {tx.to}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {tx.amount && (
                        <p className="font-semibold">
                          {tx.amount} {tx.token}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>Gas: {(parseFloat(tx.gasUsed) / 1e12).toFixed(2)} TGas</span>
                    <span>Fee: {tx.gasFee} NEAR</span>
                    <span>Block: {tx.blockHeight}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your transaction history will appear here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Transaction Details</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://explorer.near.org/transactions/${selectedTransaction.hash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Explorer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTransaction(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hash</label>
                    <p className="font-mono text-sm break-all">{selectedTransaction.hash}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="capitalize">{selectedTransaction.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(selectedTransaction.type)}
                      <span className="capitalize">{selectedTransaction.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Block Height</label>
                    <p>{selectedTransaction.blockHeight}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">From</label>
                    <p className="font-mono text-sm">{selectedTransaction.from}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">To</label>
                    <p className="font-mono text-sm">{selectedTransaction.to}</p>
                  </div>
                  {selectedTransaction.amount && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Amount</label>
                        <p>{selectedTransaction.amount} {selectedTransaction.token}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gas Used</label>
                    <p>{(parseFloat(selectedTransaction.gasUsed) / 1e12).toFixed(2)} TGas</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gas Fee</label>
                    <p>{selectedTransaction.gasFee} NEAR</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timestamp</label>
                    <p>{selectedTransaction.timestamp.toLocaleString()}</p>
                  </div>
                </div>

                {selectedTransaction.methodName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Method</label>
                    <p className="font-mono">{selectedTransaction.methodName}</p>
                  </div>
                )}

                {selectedTransaction.args && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Arguments</label>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedTransaction.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionHistory; 