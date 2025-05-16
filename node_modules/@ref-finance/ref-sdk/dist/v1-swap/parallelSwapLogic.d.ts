import Big from 'big.js';
import { Pool } from '../types';
interface FormatedPool extends Pool {
    x?: string;
    y?: string;
    gamma_bps?: Big;
}
/** formatPoolNew
 * This function appends to the existing standard Pool struct and adds attributes that simplify the parallel swap algorithms.
 * Adds attributes "x" (for input token reserves in pool), "y" (for output token reserves in pool), and "gamma_bps" (for 1- fee in bps)
 * Our convention for our algorithm has been to use "x" as the input token and "y" as the output token.
 * @param pool    AMM structure containing reserves of inputToken and outputToken
 * @param inputToken the name of the inputToken being traded in.
 * @param outputToken the name of the outputToken being traded out.
 * @returns newFormatPool
 */
export declare function formatPoolNew(pool: Pool, inputToken: string, outputToken: string): FormatedPool;
/** solveForMuFloat
 * This function takes the set of token pools, the total input of inputToken, and the names of inputToken and outputToken and
 * solves for the Lagrange Multiplier "mu". Note that mu must be allowed to be aritrary precision floating point number. Mu will
 * be used in subsequent function calls to determine the best allocations of intputToken to be made per pool.
 * For more detailed math on how this function was derived, please see the white paper:
 * https://github.com/giddyphysicist/ParallelSwapForRefFinance/blob/main/ParallelSwapWhitePaper.pdf
 * @param pools   list of pools that contain inputToken and outputToken
 * @param totalDeltaX  total allocation (among all pools) being input of inputToken
 * @param inputToken   the name of the inputToken being traded in.
 * @param outputToken   the name of the outputToken being traded out.
 * @returns mu   the lagrange multiplier value calculated for a set of pools and inputToken amount.
 */
export declare function solveForMuFloat(pools: Pool[], totalDeltaX: string, inputToken: string, outputToken: string): number | Big;
/** calculate_dx_float
 * Once mu has been calculated for a set of pools and total input amount, the next step is
 * determining the total allocation per pool. This function evaluates the amount of input Token to be
 * allocated to the given pool. Note, in our original algorithmic convention, the 'x' variable was for the input token,
 * and the 'y' variable was for the output token. Here, the value dx is the part of the full amount of input token X.
 * Again, the detailed formulae for these operations can be found in the white paper referenced above.
 * @param mu   the lagrange multiplier value calculated for a set of pools and inputToken amount.
 * @param pool   AMM structure containing reserves of inputToken and outputToken
 * @param inputToken the name of the inputToken being traded in.
 * @param outputToken  the name of the outputToken being traded out.
 * @returns dxFloat   the allocation amount determined for the given pool
 */
export declare function calculate_dx_float(mu: number | Big, pool: FormatedPool, inputToken: string, outputToken: string): Big;
/** calculate_dy_float
 * Once you have an allocation amount for a given pool, you can use the AMM constant-product formula to determine
 * the expected output amount of output Token.
 * Note, here, as earlier, our algorithmic convention uses "y" as the output token, and so "dy" is the fraction of
 * the total output of output Token, assuming there could be dy contributions from other parallel pools as well.
 * @param dx_float  input allocation amount of inputToken for the given pool
 * @param pool   a structure representing the reserves and fees for a given pool.
 * @param inputToken  the name of the inputToken being traded in.
 * @param outputToken  the name of the outputToken being traded out.
 * @returns dyFloat  the expected trade out amount out of outputToken
 */
export declare function calculate_dy_float(dx_float: number, pool: FormatedPool, inputToken: string, outputToken: string): Big;
/** calculateOptimalOutput
 * This is the main function, which calculates optimal values of inputToken to swap into each pool.
 * @param pools  list of relevant AMM pools containing inputToken and outputToken
 * @param inputAmount   the numeric total amount of inputToken to be traded into the group of swap pools.
 * @param inputToken   the name of the inputToken being traded in.
 * @param outputToken  the name of the outputToken being traded out.
 * @returns normalizedDxArray an array containing the amount allocations of inputToken per pool in the list of pools.
 */
export declare function calculateOptimalOutput(pools: Pool[], inputAmount: string, inputToken: string, outputToken: string): bigint[];
/** reducePools
 * This function is used to implement part of the non-linear slack variables in the lagrange - multiplier
 * solution for parallel swap. Part of what comes out of the math is that sometimes, the optimal allocation for a pool
 * can be negative, which makes no physical sense. When this occurs, that particular pool needs to be flagged and the
 * lagrange constraint applied to force the allocation to be zero.
 * This function takes an already-solved set of pools, input allocation per pool, the total input amount, and the
 * inputToken name and outputToken name, and determines which, if any, allocations need to be set to zero.
 * However, when this occurs, and a pool is essentially ignored from the list, then the calculation for mu must be re-done.
 * So the calculateOptimalOutput function is then called on the reduced set of pools, and if no negative allocation values remain,
 * then the allocations on the reduced set is determined, and values of zero are put in for the 'failed' pools.
 * @param pools  list of pools that contain inputToken and outputToken
 * @param dxArray  list of input allocation per pool
 * @param inputAmount   total amount of inputToken to be traded among the pools
 * @param inputToken    the name of the inputToken
 * @param outputToken   the name of the outputToken
 * @returns newFullDxVec  the new full list of input allocations the same length as dxArray, containing zeros for failed pools.
 */
export declare function reducePools(pools: Pool[], dxArray: Big[], inputAmount: string, inputToken: string, outputToken: string): any[];
export declare function checkIntegerSumOfAllocations(allocations: Big[] | string[] | BigInt[], totalInput: Big | string | BigInt): any[];
export {};
