import { Router } from 'express';
import { VerifiableComputeService } from '../services/eigencloud/verifiable-compute';
import { EigenDAService } from '../services/eigencloud/data-availability';
import { logger } from '../setup';

const router = Router();

// Initialize services
const eigenCloudConfig = {
  computeEndpoint: process.env.EIGENCLOUD_COMPUTE_ENDPOINT || 'https://compute.eigencloud.xyz',
  apiKey: process.env.EIGENCLOUD_API_KEY!,
  network: (process.env.NETWORK || 'testnet') as 'mainnet' | 'testnet',
  contractAddress: process.env.VERIFIABLE_AI_ORACLE_ADDRESS!,
  privateKey: process.env.PRIVATE_KEY!
};

const daConfig = {
  endpoint: process.env.EIGENCLOUD_DA_ENDPOINT || 'https://da.eigencloud.xyz',
  apiKey: process.env.EIGENCLOUD_API_KEY!,
  contractAddress: process.env.PORTFOLIO_HISTORY_DA_ADDRESS!,
  defaultRedundancy: 10,
  defaultExpiration: 365 * 24 * 60 * 60 // 1 year in seconds
};

const computeService = new VerifiableComputeService(eigenCloudConfig, logger);
const daService = new EigenDAService(
  daConfig,
  computeService['provider'], // Access provider from compute service
  logger
);

/**
 * Submit portfolio for verifiable analysis
 */
router.post('/analyze', async (req, res) => {
  try {
    const { portfolio, verificationLevel, modelVersion, marketData } = req.body;

    // Validate request
    if (!portfolio || !portfolio.tokens || !portfolio.amounts) {
      return res.status(400).json({ error: 'Invalid portfolio data' });
    }

    // Submit for verifiable computation
    const result = await computeService.submitVerifiablePortfolioAnalysis(
      portfolio,
      marketData || {
        prices: portfolio.tokens.map(() => Math.random() * 1000),
        volumes: portfolio.tokens.map(() => Math.random() * 1000000),
        timestamp: Date.now()
      }
    );

    // Store in data availability layer
    await daService.storePortfolioHistory(
      req.user?.id || 'anonymous',
      portfolio,
      [{
        type: 'VERIFIABLE_ANALYSIS',
        recommendation: result.recommendation,
        reasoning: 'AI-generated recommendation with cryptographic proof',
        confidence: result.confidence,
        timestamp: Date.now()
      }]
    );

    res.json(result);

  } catch (error) {
    logger.error('Verifiable analysis failed', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

/**
 * Verify computation proof
 */
router.post('/verify', async (req, res) => {
  try {
    const { proof } = req.body;

    if (!proof) {
      return res.status(400).json({ error: 'Proof required' });
    }

    const isValid = await computeService.verifyComputationProof(proof);

    res.json({
      valid: isValid,
      details: isValid ? 'Proof verified successfully' : 'Invalid proof'
    });

  } catch (error) {
    logger.error('Proof verification failed', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Get portfolio history from EigenDA
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startTime, endTime } = req.query;

    const history = await daService.retrievePortfolioHistory(
      userId,
      Number(startTime) || Date.now() - 30 * 24 * 60 * 60 * 1000, // Default 30 days
      Number(endTime) || Date.now()
    );

    res.json({ history });

  } catch (error) {
    logger.error('Failed to retrieve history', error);
    res.status(500).json({ error: 'History retrieval failed' });
  }
});

/**
 * Submit custom computation
 */
router.post('/compute/custom', async (req, res) => {
  try {
    const { program, inputs, requirements } = req.body;

    const taskId = await computeService.submitCustomComputation({
      program,
      inputs,
      requirements: {
        minValidators: requirements?.minValidators || 3,
        redundancy: requirements?.redundancy || 3,
        verificationLevel: requirements?.verificationLevel || 'HIGH',
        maxComputeTime: requirements?.maxComputeTime || 300
      }
    });

    res.json({ taskId });

  } catch (error) {
    logger.error('Custom computation failed', error);
    res.status(500).json({ error: 'Computation submission failed' });
  }
});

/**
 * Get computation status
 */
router.get('/compute/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const status = await computeService.getComputationStatus(taskId);
    res.json(status);

  } catch (error) {
    logger.error('Failed to get computation status', error);
    res.status(500).json({ error: 'Status retrieval failed' });
  }
});

/**
 * Run verifiable backtest
 */
router.post('/backtest', async (req, res) => {
  try {
    const { strategy, historicalData } = req.body;

    if (!strategy || !historicalData) {
      return res.status(400).json({ error: 'Strategy and historical data required' });
    }

    const result = await computeService.runVerifiableBacktest(
      strategy,
      historicalData
    );

    // Store backtest results in EigenDA
    const blobId = await daService.storeBlob({
      data: JSON.stringify({
        strategy,
        result,
        timestamp: Date.now()
      }),
      redundancy: 15,
      expirationDays: 730, // 2 years
      priority: 'HIGH'
    });

    res.json({
      ...result,
      eigenDABlobId: blobId
    });

  } catch (error) {
    logger.error('Verifiable backtest failed', error);
    res.status(500).json({ error: 'Backtest failed' });
  }
});

export default router;