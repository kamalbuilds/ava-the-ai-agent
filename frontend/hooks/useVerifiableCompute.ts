import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from './use-toast';

export interface VerificationStatus {
  isVerified: boolean;
  validatorCount: number;
  confidence: number;
  proofHash: string;
  computeTime: number;
  modelHash: string;
}

export interface VerifiableResult {
  taskId: string;
  recommendation: {
    tokens: string[];
    allocations: number[];
    riskScore: number;
    strategy: string;
    reasoning?: string;
  };
  proof: string;
  validators: string[];
  confidence: number;
  computeTime: number;
}

export const useVerifiableCompute = () => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitAnalysis = useCallback(async (portfolio: any): Promise<VerifiableResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API for verifiable analysis
      const response = await fetch('/api/eigencloud/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio,
          verificationLevel: 'HIGH',
          modelVersion: 'portfolio_optimizer_v2'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit analysis');
      }

      const data = await response.json();

      // Update verification status
      setVerificationStatus({
        isVerified: true,
        validatorCount: data.validators.length,
        confidence: data.confidence,
        proofHash: data.proof,
        computeTime: data.computeTime,
        modelHash: data.modelHash
      });

      toast({
        title: "Analysis Complete",
        description: `Verified by ${data.validators.length} validators with ${data.confidence}% confidence`,
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const verifyProof = useCallback(async (proof: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/eigencloud/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proof }),
      });

      const data = await response.json();
      return data.valid;
    } catch (err) {
      console.error('Failed to verify proof:', err);
      return false;
    }
  }, []);

  return {
    submitAnalysis,
    verifyProof,
    verificationStatus,
    isLoading,
    error,
  };
};