import { StablePool } from './types';
export declare const calc_d: (amp: number, c_amounts: number[]) => number;
export declare const calc_y: (amp: number, x_c_amount: number, current_c_amounts: number[], index_x: number, index_y: number) => number;
export declare const calc_swap: (amp: number, in_token_idx: number, in_c_amount: number, out_token_idx: number, old_c_amounts: number[], trade_fee: number) => number[];
export declare const getSwappedAmount: (tokenInId: string, tokenOutId: string, amountIn: string, stablePool: StablePool, STABLE_LP_TOKEN_DECIMALS: number) => number[];
