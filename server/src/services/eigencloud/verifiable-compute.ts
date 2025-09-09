import { ethers } from 'ethers';
import { Logger } from 'winston';
import { VerifiableAIOracle } from '../../types/contracts';
import { Portfolio, MarketData, VerifiableResult } from '../../types';

export interface EigenCloudConfig {
  computeEndpoint: string;
  apiKey: string;
  network: 'mainnet' | 'testnet';
  contractAddress: string;
  privateKey: string;
}

export interface ComputeRequest {
  program: string;
  inputs: any;
  requirements: {
    minValidators: number;
    redundancy: number;
    verificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
    maxComputeTime: number;
  };
}

export interface VerifiableRecommendation {
  tokens: string[];
  allocations: number[];
  riskScore: number;
  strategy: string;
  confidence: number;
  proof: string;
}

export class VerifiableComputeService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private aiOracle: ethers.Contract;
  private logger: Logger;
  
  constructor(
    private config: EigenCloudConfig,
    logger: Logger
  ) {
    this.logger = logger;
    this.provider = new ethers.JsonRpcProvider(
      config.network === 'mainnet' 
        ? process.env.RPC_ENDPOINT_MAINNET 
        : process.env.RPC_ENDPOINT_TESTNET
    );
    
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    
    // Initialize AI Oracle contract
    const aiOracleAbi = [
      'function requestPortfolioAnalysis(address[] tokens, uint256[] amounts, bytes marketData, bytes32 modelHash) returns (uint256)',
      'function getInferenceDetails(uint256 taskId) view returns (tuple(bytes32,bytes32,bytes32,uint256,address[],uint256,uint256,uint8), tuple(address[],uint256[],uint256,string,bytes))',
      'event VerifiableInferenceCompleted(uint256 indexed taskId, bytes32 outputHash, uint256 confidence)'
    ];
    
    this.aiOracle = new ethers.Contract(
      config.contractAddress,
      aiOracleAbi,
      this.signer
    );
  }
  
  /**
   * Submit portfolio for verifiable AI analysis
   */
  async submitVerifiablePortfolioAnalysis(
    portfolio: Portfolio,
    marketData: MarketData
  ): Promise<VerifiableResult> {
    try {
      this.logger.info('Submitting portfolio for verifiable analysis', {
        tokenCount: portfolio.tokens.length,
        totalValue: portfolio.totalValue
      });
      
      // Encode market data
      const encodedMarketData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256[]', 'uint256[]', 'uint256'],
        [
          marketData.prices,
          marketData.volumes,
          marketData.timestamp
        ]
      );
      
      // Use verified model hash (in production, this would be configurable)
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes('portfolio_optimizer_v2'));
      
      // Submit to AI Oracle
      const tx = await this.aiOracle.requestPortfolioAnalysis(
        portfolio.tokens,
        portfolio.amounts,
        encodedMarketData,
        modelHash
      );
      
      const receipt = await tx.wait();
      const taskId = this.extractTaskId(receipt);
      
      this.logger.info('Verifiable analysis submitted', { taskId });
      
      // Wait for computation to complete
      const result = await this.waitForVerifiableResult(taskId);
      
      return {
        taskId,
        recommendation: result.recommendation,
        proof: result.proof,
        validators: result.validators,
        confidence: result.confidence,
        computeTime: result.computeTime,
        modelHash: modelHash
      };
      
    } catch (error) {
      this.logger.error('Failed to submit verifiable analysis', error);
      throw error;
    }
  }
  
  /**
   * Wait for verifiable computation result
   */
  private async waitForVerifiableResult(
    taskId: string,
    timeout: number = 300000 // 5 minutes
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Set up event listener
      const filter = this.aiOracle.filters.VerifiableInferenceCompleted(taskId);
      
      const checkResult = async () => {
        try {
          const [inference, recommendation] = await this.aiOracle.getInferenceDetails(taskId);
          
          if (inference.status === 2) { // Completed
            const result = {
              recommendation: {
                tokens: recommendation.tokens,
                allocations: recommendation.allocations,
                riskScore: recommendation.riskScore,
                strategy: recommendation.strategy
              },
              proof: inference.computeProof.toString(),
              validators: inference.validators,
              confidence: Number(inference.confidence),
              computeTime: Date.now() - startTime
            };
            
            this.aiOracle.removeAllListeners(filter);
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            this.aiOracle.removeAllListeners(filter);
            reject(new Error('Computation timeout'));
          } else {
            // Check again in 5 seconds
            setTimeout(checkResult, 5000);
          }
        } catch (error) {
          this.aiOracle.removeAllListeners(filter);
          reject(error);
        }
      };
      
      // Start checking
      checkResult();
    });
  }
  
  /**
   * Verify a computation proof
   */
  async verifyComputationProof(proof: string): Promise<boolean> {
    // In production, this would call the EigenCompute verification endpoint
    try {
      const response = await fetch(`${this.config.computeEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ proof })
      });
      
      const result = await response.json();
      return result.valid;
    } catch (error) {
      this.logger.error('Failed to verify proof', error);
      return false;
    }
  }
  
  /**
   * Submit custom computation to EigenCompute
   */
  async submitCustomComputation(request: ComputeRequest): Promise<string> {
    try {
      const response = await fetch(`${this.config.computeEndpoint}/compute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      return result.taskId;
    } catch (error) {
      this.logger.error('Failed to submit computation', error);
      throw error;
    }
  }
  
  /**
   * Get computation status
   */
  async getComputationStatus(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.computeEndpoint}/status/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      return await response.json();
    } catch (error) {
      this.logger.error('Failed to get computation status', error);
      throw error;
    }
  }
  
  /**
   * Extract task ID from transaction receipt
   */
  private extractTaskId(receipt: ethers.TransactionReceipt): string {
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.aiOracle.interface.parseLog(log);
        return parsed?.name === 'VerifiableInferenceRequested';
      } catch {
        return false;
      }
    });
    
    if (!event) {
      throw new Error('Task ID not found in receipt');
    }
    
    const parsed = this.aiOracle.interface.parseLog(event);
    return parsed.args.taskId.toString();
  }
  
  /**
   * Run verifiable backtesting
   */
  async runVerifiableBacktest(
    strategy: any,
    historicalData: any[]
  ): Promise<any> {
    const request: ComputeRequest = {
      program: 'portfolio_backtest_v2',
      inputs: {
        strategy: strategy,
        historicalData: historicalData,
        config: {
          slippage: 0.001,
          fees: 0.0025,
          rebalanceFrequency: 'daily'
        }
      },
      requirements: {
        minValidators: 3,
        redundancy: 3,
        verificationLevel: 'HIGH',
        maxComputeTime: 600 // 10 minutes
      }
    };
    
    const taskId = await this.submitCustomComputation(request);
    return await this.waitForComputationResult(taskId);
  }
  
  /**
   * Wait for custom computation result
   */
  private async waitForComputationResult(
    taskId: string,
    pollInterval: number = 5000
  ): Promise<any> {
    while (true) {
      const status = await this.getComputationStatus(taskId);
      
      if (status.state === 'COMPLETED') {
        return status.result;
      } else if (status.state === 'FAILED') {
        throw new Error(`Computation failed: ${status.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}