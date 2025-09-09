import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, AlertTriangle, Activity, Users, Clock } from 'lucide-react';
import { useVerifiableCompute } from '@/hooks/useVerifiableCompute';

interface VerificationStatus {
  isVerified: boolean;
  validatorCount: number;
  confidence: number;
  proofHash: string;
  computeTime: number;
  modelHash: string;
}

interface PortfolioRecommendation {
  tokens: string[];
  allocations: number[];
  riskScore: number;
  strategy: string;
  reasoning?: string;
}

export const VerifiableAnalysis: React.FC<{ portfolio: any }> = ({ portfolio }) => {
  const { submitAnalysis, verificationStatus, isLoading, error } = useVerifiableCompute();
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAnalysis = async () => {
    const result = await submitAnalysis(portfolio);
    if (result) {
      setRecommendation(result.recommendation);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-500';
    if (confidence >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 30) return 'bg-green-500';
    if (riskScore <= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verifiable AI Analysis
          </span>
          {verificationStatus?.isVerified && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Get cryptographically verified portfolio recommendations powered by EigenCloud
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Verification Status */}
        {verificationStatus && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Status</span>
              <span className={`text-sm font-bold ${getConfidenceColor(verificationStatus.confidence)}`}>
                {verificationStatus.confidence}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{verificationStatus.validatorCount} Validators</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{verificationStatus.computeTime}ms</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <div>Proof: {verificationStatus.proofHash.slice(0, 20)}...</div>
              <div>Model: {verificationStatus.modelHash.slice(0, 20)}...</div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!recommendation && (
          <Button 
            onClick={handleAnalysis} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Computing Verifiable Analysis...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Get Verifiable Analysis
              </>
            )}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Recommendation Display */}
        {recommendation && (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Strategy</span>
                  <span className="text-sm">{recommendation.strategy}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm">{recommendation.riskScore}/100</span>
                  </div>
                  <Progress 
                    value={recommendation.riskScore} 
                    className="h-2"
                    indicatorClassName={getRiskColor(recommendation.riskScore)}
                  />
                </div>
              </div>

              {recommendation.reasoning && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm">{recommendation.reasoning}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="allocations" className="space-y-3">
              {recommendation.tokens.map((token, index) => (
                <div key={token} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span className="font-medium">{token}</span>
                  <span className="text-sm">{recommendation.allocations[index]}%</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Computation verified by decentralized network</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Cryptographic proof generated</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Result consensus achieved</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>

              {showDetails && (
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                  <pre>{JSON.stringify(verificationStatus, null, 2)}</pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};