import { TokenMetadata, EstimateSwapView, Transaction } from '../types';
export declare const instantSwap: ({ tokenIn, tokenOut, amountIn, slippageTolerance, swapTodos, AccountId, referralId, }: {
    tokenIn: TokenMetadata;
    tokenOut: TokenMetadata;
    amountIn: string;
    slippageTolerance: number;
    swapTodos: EstimateSwapView[];
    AccountId: string;
    referralId?: string | undefined;
}) => Promise<Transaction[]>;
