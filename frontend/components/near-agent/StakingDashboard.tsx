"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNearAgent } from '@/contexts/NearAgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Coins
} from 'lucide-react';

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div 
      className="bg-blue-600 h-full rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface Validator {
  validatorId: string;
  name: string;
  fee: number;
  apy: number;
  totalStaked: string;
  isActive: boolean;
  description: string;
  uptime?: number;
  commission?: number;
}

interface StakingPosition {
  validatorId: string;
  stakedAmount: string;
  unstakedAmount: string;
  rewards: string;
  canWithdraw: boolean;
  validatorName: string;
}

const StakingDashboard: React.FC = () => {
  const { state, connectWallet, buildTransaction, executeTransaction } = useNearAgent();
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'positions'>('stake');
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.isConnected) {
      loadStakingPositions();
    }
  }, [state.isConnected]);

  const loadStakingPositions = async () => {
    try {
      // In production, fetch from portfolio API
      const mockPositions: StakingPosition[] = [
        {
          validatorId: 'meta-pool.pool.near',
          stakedAmount: '1500.0',
          unstakedAmount: '0',
          rewards: '12.8',
          canWithdraw: false,
          validatorName: 'Meta Pool'
        },
        {
          validatorId: 'aurora.pool.near',
          stakedAmount: '800.0',
          unstakedAmount: '50.0',
          rewards: '8.4',
          canWithdraw: true,
          validatorName: 'Aurora Pool'
        }
      ];
      setStakingPositions(mockPositions);
    } catch (error) {
      console.error('Failed to load staking positions:', error);
    }
  };

  const handleStake = async () => {
    if (!selectedValidator || !stakeAmount || !state.isConnected) return;

    try {
      setLoading(true);
      const transaction = await buildTransaction({
        type: 'stake',
        validatorId: selectedValidator.validatorId,
        amount: stakeAmount
      });

      await executeTransaction(transaction);
      setStakeAmount('');
      loadStakingPositions();
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (validatorId: string, amount: string) => {
    try {
      setLoading(true);
      const transaction = await buildTransaction({
        type: 'unstake',
        validatorId,
        amount
      });

      await executeTransaction(transaction);
      loadStakingPositions();
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStaked = () => {
    return stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.stakedAmount), 0);
  };

  const calculateTotalRewards = () => {
    return stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0);
  };

  const getValidatorRiskLevel = (validator: Validator) => {
    if (validator.fee < 3) return 'low';
    if (validator.fee < 6) return 'medium';
    return 'high';
  };

  if (!state.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 mb-6">Connect your NEAR wallet to start staking and earning rewards</p>
        <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staked</p>
                <p className="text-2xl font-bold">{calculateTotalStaked().toFixed(2)} NEAR</p>
              </div>
              <Coins className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-green-600">{calculateTotalRewards().toFixed(2)} NEAR</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Positions</p>
                <p className="text-2xl font-bold">{stakingPositions.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Annual Yield</p>
                <p className="text-2xl font-bold">10.8%</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {(['stake', 'unstake', 'positions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stake Tab */}
      {activeTab === 'stake' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Validator Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Validator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.validators.map((validator) => (
                  <motion.div
                    key={validator.validatorId}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedValidator(validator)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedValidator?.validatorId === validator.validatorId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{validator.name}</h3>
                        <p className="text-sm text-gray-600">{validator.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={getValidatorRiskLevel(validator) === 'low' ? 'default' : 'secondary'}
                        >
                          {validator.apy}% APY
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Fee: {validator.fee}%</span>
                      <span>Staked: {(parseFloat(validator.totalStaked) / 1000000).toFixed(1)}M NEAR</span>
                    </div>
                    
                    {validator.uptime && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Uptime</span>
                          <span>{validator.uptime}%</span>
                        </div>
                        <Progress value={validator.uptime} className="h-2" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Stake Form */}
          <Card>
            <CardHeader>
              <CardTitle>Stake NEAR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedValidator ? (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Selected Validator</p>
                    <p className="text-blue-600">{selectedValidator.name}</p>
                    <p className="text-sm text-gray-600">{selectedValidator.apy}% APY</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Amount to Stake</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {state.portfolio?.nearBalance || '0'} NEAR
                    </p>
                  </div>

                  {stakeAmount && (
                    <div className="p-3 bg-green-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Est. Annual Rewards</span>
                        <span className="font-medium">
                          {(parseFloat(stakeAmount) * selectedValidator.apy / 100).toFixed(2)} NEAR
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Validator Fee</span>
                        <span>{selectedValidator.fee}%</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleStake}
                    disabled={!stakeAmount || loading}
                    className="w-full"
                  >
                    {loading ? 'Staking...' : 'Stake NEAR'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a validator to continue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Staking Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {stakingPositions.length > 0 ? (
                <div className="space-y-4">
                  {stakingPositions.map((position, index) => (
                    <motion.div
                      key={position.validatorId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{position.validatorName}</h3>
                          <p className="text-sm text-gray-600">{position.validatorId}</p>
                        </div>
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Staked</p>
                          <p className="font-semibold">{position.stakedAmount} NEAR</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rewards</p>
                          <p className="font-semibold text-green-600">{position.rewards} NEAR</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Unstaked</p>
                          <p className="font-semibold">{position.unstakedAmount} NEAR</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className={`font-semibold ${position.canWithdraw ? 'text-green-600' : 'text-yellow-600'}`}>
                            {position.canWithdraw ? 'Ready' : 'Locked'}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnstake(position.validatorId, (parseFloat(position.stakedAmount) * 0.1).toString())}
                          disabled={loading}
                        >
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          Unstake 10%
                        </Button>
                        
                        {position.canWithdraw && parseFloat(position.unstakedAmount) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Withdraw
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Compound
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Staking Positions</h3>
                  <p className="text-gray-600 mb-6">Start staking NEAR to earn rewards</p>
                  <Button onClick={() => setActiveTab('stake')}>
                    Start Staking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default StakingDashboard; 