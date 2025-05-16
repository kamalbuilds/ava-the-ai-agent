import { keyStores, InMemorySigner, providers, transactions as nearTransactions } from 'near-api-js';
import { Transaction } from './types';
export declare const getKeyStore: () => keyStores.InMemoryKeyStore | keyStores.BrowserLocalStorageKeyStore;
export declare const provider: providers.JsonRpcProvider;
export declare const getMemorySigner: ({ AccountId, keyPath, }: {
    AccountId: string;
    keyPath: string;
}) => Promise<InMemorySigner>;
export declare const getSignedTransactionsByMemoryKey: ({ transactionsRef, AccountId, keyPath, }: {
    transactionsRef: Transaction[];
    AccountId: string;
    keyPath: string;
}) => Promise<nearTransactions.SignedTransaction[]>;
export declare const sendTransactionsByMemoryKey: ({ signedTransactions, }: {
    signedTransactions: nearTransactions.SignedTransaction[];
}) => Promise<providers.FinalExecutionOutcome[]>;
