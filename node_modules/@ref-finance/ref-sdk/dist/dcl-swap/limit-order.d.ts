import { Transaction } from '../types';
export interface UserOrderInfo {
    order_id: string;
    owner_id: string;
    pool_id: string;
    point: number;
    sell_token: string;
    created_at: string;
    original_amount: string;
    remain_amount: string;
    cancel_amount: string;
    original_deposit_amount: string;
    swap_earn_amount: string;
    buy_token: string;
    unclaimed_amount: string;
    bought_amount: string;
}
export declare const list_history_orders: (AccountId: string) => Promise<any>;
export declare const list_active_orders: (AccountId: string) => Promise<any>;
export declare const get_order: (order_id: string) => Promise<any>;
export declare const find_order: ({ pool_id, point, AccountId, }: {
    pool_id: string;
    point: number;
    AccountId: string;
}) => Promise<UserOrderInfo>;
export declare const cancel_order: (order_id: string) => Promise<Transaction[]>;
export declare const claim_order: (order_id: string) => Transaction[];
export declare const get_pointorder_range: ({ pool_id, left_point, right_point, }: {
    pool_id: string;
    left_point?: number | undefined;
    right_point?: number | undefined;
}) => Promise<any>;
