import { TokenMetadata } from './tokenTypes';

/**
 * Pool types supported by Ref Finance
 */
export enum PoolType {
  SIMPLE_POOL = 'SIMPLE_POOL',
  STABLE_POOL = 'STABLE_POOL',
  RATED_POOL = 'RATED_POOL'
}

/**
 * Fee structure for pools
 */
export interface PoolFee {
  fee: number;
  percent: number;
}

/**
 * Base pool interface with common properties
 */
export interface BasePool {
  id: number;
  tokenIds: string[];
  supplies: string[];
  fee: number;
  type: PoolType;
  shareSupply: string;
}

/**
 * Simple pool interface
 */
export interface SimplePool extends BasePool {
  type: PoolType.SIMPLE_POOL;
}

/**
 * Stable pool interface
 */
export interface StablePool extends BasePool {
  type: PoolType.STABLE_POOL;
  ampFactor: string;
  rates: string[];
}

/**
 * Rated pool interface
 */
export interface RatedPool extends BasePool {
  type: PoolType.RATED_POOL;
  ampFactor: string;
  rates: string[];
}

/**
 * Union type for all pool types
 */
export type Pool = SimplePool | StablePool | RatedPool;

/**
 * Pool details with token metadata
 */
export interface PoolDetails {
  id: number;
  tokenIds: string[];
  supplies: string[];
  fee: number;
  type: PoolType;
  shareSupply: string;
  tokens: TokenMetadata[];
  // Optional properties for stable and rated pools
  ampFactor?: string;
  rates?: string[];
}

/**
 * Response from the Ref Finance API when fetching pools
 */
export interface GetPoolsResponse {
  pools: Pool[];
}

/**
 * Swap route representation
 */
export interface SwapRoute {
  poolId: number;
  inputToken: string;
  outputToken: string;
  pool: Pool;
  percent: number;
}

/**
 * Parameters for smart swap
 */
export interface SmartRoutingParams {
  fromTokenId: string;
  toTokenId: string;
  amountIn: string;
  maxHops?: number;
  maxRoutes?: number;
}

/**
 * Smart routing solution
 */
export interface SmartRoutingSolution {
  routes: SwapRoute[];
  expectedOut: string;
  priceImpact: number;
} 