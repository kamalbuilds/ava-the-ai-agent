import { TokenMetadata, Transaction } from '../types';
interface SwapInfo {
    tokenA: TokenMetadata;
    tokenB: TokenMetadata;
    amountA: string;
}
interface DCLSwapProps {
    swapInfo: SwapInfo;
    Swap?: {
        pool_ids: string[];
        min_output_amount: string;
    };
    SwapByOutput?: {
        pool_ids: string[];
        output_amount: string;
    };
    LimitOrderWithSwap?: {
        pool_id: string;
        output_amount: string;
    };
    SwapByStopPoint?: {
        pool_id: string;
        stop_point: number;
        skip_unwrap_near: boolean;
    };
    AccountId: string;
}
export declare const DCL_POOL_SPLITER = "|";
export declare const DCLSwap: ({ Swap, SwapByOutput, LimitOrderWithSwap, SwapByStopPoint, AccountId, swapInfo, }: DCLSwapProps) => Promise<Transaction[]>;
export declare const quote: ({ pool_ids, input_amount, input_token, output_token, tag, }: {
    pool_ids: string[];
    input_token: TokenMetadata;
    output_token: TokenMetadata;
    input_amount: string;
    tag?: string | undefined;
}) => Promise<any>;
export declare const list_user_assets: (AccountId: string) => Promise<any>;
export declare const DCLSwapByInputOnBestPool: ({ tokenA, tokenB, amountA, slippageTolerance, AccountId, }: {
    tokenA: TokenMetadata;
    tokenB: TokenMetadata;
    amountA: string;
    slippageTolerance: number;
    AccountId: string;
}) => Promise<Transaction[]>;
export declare const quote_by_output: ({ pool_ids, output_amount, input_token, output_token, }: {
    pool_ids: string[];
    input_token: TokenMetadata;
    output_token: TokenMetadata;
    output_amount: string;
}) => Promise<any>;
export {};
