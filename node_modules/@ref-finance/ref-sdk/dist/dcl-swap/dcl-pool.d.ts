import { TokenMetadata } from '../types';
export declare const DCL_POOL_FEE_LIST: number[];
interface PoolInfo {
    pool_id?: string;
    token_x?: string;
    token_y?: string;
    fee: number;
    point_delta?: number;
    current_point?: number;
    state?: string;
    liquidity?: string;
    liquidity_x?: string;
    max_liquidity_per_point?: string;
    percent?: string;
    total_x?: string;
    total_y?: string;
    tvl?: number;
    token_x_metadata?: TokenMetadata;
    token_y_metadata?: TokenMetadata;
}
export declare const getDCLPoolId: (tokenA: string, tokenB: string, fee: number) => string;
export declare const listDCLPools: () => Promise<any>;
export declare const getDCLPool: (pool_id: string) => Promise<PoolInfo>;
export {};
