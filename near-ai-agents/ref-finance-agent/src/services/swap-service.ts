import { RefApiClient } from './api-client';
import { PoolService } from './pool-service';
import { TokenService } from './token-service';
import { 
  SwapParams, 
  SwapResponse, 
  SwapResult, 
  TokenMetadata,
  RouteInfo
} from '../types';
import { REF_CONSTANTS } from '../utils/config';
import { createLogger } from '../utils/logger';
import { utils } from 'near-api-js';

/**
 * Service for executing swaps on Ref Finance
 */
export class SwapService {
  private apiClient: RefApiClient;
  private poolService: PoolService;
  private tokenService: TokenService;
  private logger = createLogger('SwapService');

  constructor(
    apiClient: RefApiClient,
    poolService: PoolService,
    tokenService: TokenService
  ) {
    this.apiClient = apiClient;
    this.poolService = poolService;
    this.tokenService = tokenService;
  }

  /**
   * Execute a token swap on Ref Finance
   * @param params The swap parameters
   * @returns The swap result
   */
  public async swapTokens(params: SwapParams): Promise<SwapResponse> {
    try {
      const { 
        account_id, 
        token_in, 
        token_out, 
        amount_in, 
        min_amount_out,
        pool_id,
        slippage_tolerance = REF_CONSTANTS.DEFAULT_SLIPPAGE,
        referral_id = REF_CONSTANTS.DEFAULT_REFERRAL_ID
      } = params;
      
      this.logger.info(`Preparing swap: ${amount_in} ${token_in} -> ${token_out} for account ${account_id}`);
      
      // Get account reference
      const account = await this.apiClient.getAccount(account_id);
      
      // Get token metadata
      const [tokenInMetadata, tokenOutMetadata] = await Promise.all([
        this.tokenService.getTokenMetadata(token_in),
        this.tokenService.getTokenMetadata(token_out)
      ]);
      
      this.logger.info(`Token In: ${tokenInMetadata.symbol} (${tokenInMetadata.id})`);
      this.logger.info(`Token Out: ${tokenOutMetadata.symbol} (${tokenOutMetadata.id})`);
      
      // Check if account is registered with Ref Finance
      const isRegistered = await this.isAccountRegistered(account_id);
      
      if (!isRegistered) {
        this.logger.warn(`Account ${account_id} is not registered with Ref Finance`);
        await this.registerAccountWithRef(account_id);
      }
      
      // Check token registration
      await this.ensureTokenRegistered(account_id, token_out);
      
      // Special case: If input token is native NEAR, it needs to be wrapped first
      let actualTokenIn = token_in;
      let actualAmountIn = amount_in;
      
      if (token_in === 'near') {
        this.logger.info(`Input token is NEAR, will be wrapped to wNEAR first`);
        const wrapResult = await this.wrapNear(account_id, amount_in);
        
        if (!wrapResult.success) {
          return {
            success: false,
            error: wrapResult.error
          };
        }
        
        actualTokenIn = 'wrap.near';
        actualAmountIn = wrapResult.result!.amount_out;
      }
      
      // Calculate expected output amount based on estimated price
      let expectedAmountOut = min_amount_out;
      if (!expectedAmountOut) {
        this.logger.info(`Estimating output amount with slippage ${slippage_tolerance}%`);
        const estimatedOutput = await this.getEstimatedOutput(
          actualTokenIn, 
          token_out, 
          actualAmountIn,
          pool_id
        );
        
        // Apply slippage tolerance to the estimated output
        const slippageFactor = 1 - (slippage_tolerance / 100);
        expectedAmountOut = String(Math.floor(Number(estimatedOutput) * slippageFactor));
        
        this.logger.info(`Estimated output: ${estimatedOutput}, with slippage: ${expectedAmountOut}`);
      }
      
      // Prepare and execute the swap transaction
      let swapResult: SwapResult;
      
      if (pool_id) {
        this.logger.info(`Using specific pool ID: ${pool_id}`);
        swapResult = await this.executeDirectSwap(
          account_id,
          actualTokenIn,
          token_out,
          actualAmountIn,
          expectedAmountOut,
          pool_id,
          referral_id
        );
      } else {
        this.logger.info(`Using smart routing`);
        swapResult = await this.executeSmartRoutingSwap(
          account_id,
          actualTokenIn,
          token_out,
          actualAmountIn,
          expectedAmountOut,
          slippage_tolerance,
          referral_id
        );
      }
      
      return {
        success: true,
        result: swapResult
      };
    } catch (error) {
      this.logger.error(`Failed to swap tokens: ${error}`);
      return {
        success: false,
        error: `Error during swap: ${error}`
      };
    }
  }

  /**
   * Check if an account is registered with REF Finance
   */
  private async isAccountRegistered(accountId: string): Promise<boolean> {
    try {
      this.logger.info(`Checking if account ${accountId} is registered on REF Finance...`);
      
      const account = await this.apiClient.getAccount(accountId);
      const storageBalance = await account.viewFunction({
        contractId: REF_CONSTANTS.REF_CONTRACT_ID,
        methodName: 'storage_balance_of',
        args: { account_id: accountId }
      });
      
      return storageBalance !== null && storageBalance.total !== '0';
    } catch (error) {
      this.logger.warn(`Error checking registration: ${error}`);
      return false;
    }
  }

  /**
   * Register an account with REF Finance
   */
  private async registerAccountWithRef(accountId: string): Promise<boolean> {
    try {
      this.logger.info(`Registering account ${accountId} with REF Finance...`);
      
      const account = await this.apiClient.getAccount(accountId);
      const storageAmount = utils.format.parseNearAmount(REF_CONSTANTS.STORAGE_DEPOSIT_AMOUNT);
      
      await account.functionCall({
        contractId: REF_CONSTANTS.REF_CONTRACT_ID,
        methodName: 'storage_deposit',
        args: {},
        gas: REF_CONSTANTS.STORAGE_GAS,
        attachedDeposit: storageAmount || '100000000000000000000000000' // 0.1 NEAR
      });
      
      this.logger.success(`Successfully registered account ${accountId} with REF Finance`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register account: ${error}`);
      return false;
    }
  }

  /**
   * Ensure a token is registered with an account
   */
  private async ensureTokenRegistered(accountId: string, tokenId: string): Promise<boolean> {
    try {
      if (tokenId === 'near') {
        return true; // Native NEAR doesn't need registration
      }
      
      this.logger.info(`Checking if ${tokenId} is registered for ${accountId}...`);
      
      const account = await this.apiClient.getAccount(accountId);
      const isRegistered = await account.viewFunction({
        contractId: tokenId,
        methodName: 'storage_balance_of',
        args: { account_id: accountId }
      });
      
      if (isRegistered === null) {
        this.logger.info(`Registering ${tokenId} for account ${accountId}...`);
        
        await account.functionCall({
          contractId: tokenId,
          methodName: 'storage_deposit',
          args: {
            registration_only: true,
            account_id: accountId
          },
          gas: REF_CONSTANTS.STORAGE_GAS,
          attachedDeposit: utils.format.parseNearAmount('0.00125') // Standard storage deposit
        });
        
        this.logger.success(`Successfully registered ${tokenId} for ${accountId}`);
      } else {
        this.logger.info(`${tokenId} is already registered for ${accountId}`);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error registering token ${tokenId}: ${error}`);
      return false;
    }
  }

  /**
   * Wrap NEAR to wNEAR
   */
  private async wrapNear(
    accountId: string, 
    amount: string
  ): Promise<SwapResponse> {
    try {
      this.logger.info(`Wrapping ${amount} NEAR to wNEAR...`);
      
      const account = await this.apiClient.getAccount(accountId);
      const amountYocto = utils.format.parseNearAmount(amount);
      
      if (!amountYocto) {
        return {
          success: false,
          error: 'Invalid NEAR amount'
        };
      }
      
      const result = await account.functionCall({
        contractId: 'wrap.near',
        methodName: 'near_deposit',
        args: {},
        gas: REF_CONSTANTS.SWAP_GAS,
        attachedDeposit: amountYocto
      });
      
      this.logger.success(`Successfully wrapped ${amount} NEAR to wNEAR`);
      
      return {
        success: true,
        result: {
          transaction_hash: result.transaction_outcome.id,
          token_in: 'near',
          token_out: 'wrap.near',
          amount_in: amount,
          amount_out: amount, // Same numeric value, different decimals
          fee_amount: '0',
          slippage: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to wrap NEAR: ${error}`);
      return {
        success: false,
        error: `Error wrapping NEAR: ${error}`
      };
    }
  }

  /**
   * Get estimated output amount for a swap
   */
  private async getEstimatedOutput(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    poolId?: number
  ): Promise<string> {
    try {
      this.logger.info(`Estimating output for ${amountIn} ${tokenIn} -> ${tokenOut}`);
      
      // If a specific pool is provided, use it
      if (poolId) {
        const pool = await this.poolService.getPoolById(poolId);
        
        if (!pool) {
          throw new Error(`Pool ${poolId} not found`);
        }
        
        // TODO: Implement the specific pool price calculation
        // This would require implementing the specific AMM formula
        
        this.logger.warn('Pool-specific price calculation not implemented, using fallback');
      }
      
      // For now, we'll just use a placeholder estimate
      // In a real implementation, this would call the Ref Finance API or smart contract
      
      this.logger.warn('Using placeholder estimate, actual implementation needed');
      return amountIn; // Placeholder
    } catch (error) {
      this.logger.error(`Error estimating output: ${error}`);
      return '0';
    }
  }

  /**
   * Execute a direct swap through a specific pool
   */
  private async executeDirectSwap(
    accountId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    poolId: number,
    referralId: string
  ): Promise<SwapResult> {
    try {
      this.logger.info(`Executing direct swap through pool ${poolId}`);
      
      const account = await this.apiClient.getAccount(accountId);
      
      // Prepare the swap action
      const swapAction = {
        pool_id: poolId,
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: amountIn,
        min_amount_out: minAmountOut
      };
      
      // Execute the swap
      const result = await account.functionCall({
        contractId: tokenIn,
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: REF_CONSTANTS.REF_CONTRACT_ID,
          amount: amountIn,
          msg: JSON.stringify({
            force: 0,
            actions: [swapAction],
            referral_id: referralId
          })
        },
        gas: REF_CONSTANTS.SWAP_GAS,
        attachedDeposit: '1' // One yoctoNEAR
      });
      
      this.logger.success(`Swap transaction executed: ${result.transaction_outcome.id}`);
      
      // Parse the result
      // In a real implementation, you would need to extract the actual output amount
      
      return {
        transaction_hash: result.transaction_outcome.id,
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: amountIn,
        amount_out: minAmountOut, // Placeholder, should extract from result
        fee_amount: '0', // Placeholder
        slippage: 0 // Placeholder
      };
    } catch (error) {
      this.logger.error(`Error executing direct swap: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a swap using smart routing
   */
  private async executeSmartRoutingSwap(
    accountId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    slippageTolerance: number,
    referralId: string
  ): Promise<SwapResult> {
    try {
      this.logger.info(`Executing smart routing swap`);
      
      // In a real implementation, you would:
      // 1. Find the optimal routing path(s)
      // 2. Prepare the swap actions
      // 3. Execute the swap transaction
      
      // For now, we'll use a placeholder implementation
      this.logger.warn('Smart routing not fully implemented, using direct swap as fallback');
      
      // Find the best pool for direct swap
      const directPools = await this.poolService.findDirectPools(tokenIn, tokenOut);
      
      if (directPools.length === 0) {
        throw new Error(`No direct pools found for ${tokenIn} -> ${tokenOut}`);
      }
      
      // Sort pools by some criteria (e.g., liquidity or fee)
      const bestPool = directPools[0];
      
      return await this.executeDirectSwap(
        accountId,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        bestPool.id,
        referralId
      );
    } catch (error) {
      this.logger.error(`Error executing smart routing swap: ${error}`);
      throw error;
    }
  }
} 