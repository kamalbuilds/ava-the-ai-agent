export interface CetusPool {
  poolAddress: string;
  coinTypeA: string;
  coinTypeB: string;
  current_sqrt_price: string;
  current_tick_index: string;
  tickSpacing: string;
  position_manager: {
    positions_handle: string;
  };
  ticks_handle: string;
}

export interface AddLiquidityParams {
  coinTypeA: string;
  coinTypeB: string;
  pool_id: string;
  tick_lower: string;
  tick_upper: string;
  fix_amount_a: boolean;
  amount_a: string;
  amount_b: string;
  slippage: number;
  is_open: boolean;
  rewarder_coin_types: string[];
  collect_fee: boolean;
  pos_id: string;
}

export interface SwapParams {
  pool_id: string;
  coinTypeA: string;
  coinTypeB: string;
  a2b: boolean;
  by_amount_in: boolean;
  amount: string;
  amount_limit: string;
}

export interface CreatePoolParams {
  coinTypeA: string;
  coinTypeB: string;
  tick_spacing: number;
  initialize_sqrt_price: string;
  uri: string;
  amount_a: string;
  amount_b: string;
  fix_amount_a: boolean;
  tick_lower: string;
  tick_upper: string;
  metadata_a: string;
  metadata_b: string;
}

export interface RemoveLiquidityParams {
  coinTypeA: string;
  coinTypeB: string;
  delta_liquidity: string;
  min_amount_a: string;
  min_amount_b: string;
  pool_id: string;
  pos_id: string;
  collect_fee: boolean;
}

export interface CetusPosition {
  pos_object_id: string;
  owner: string;
  pool: string;
  type: string;
  coin_type_a: string;
  coin_type_b: string;
  liquidity: string;
  tick_lower_index: number;
  tick_upper_index: number;
  index: string;
  reward_amount_owed_0: string;
  reward_amount_owed_1: string;
  reward_amount_owed_2: string;
  reward_growth_inside_0: string;
  reward_growth_inside_1: string;
  reward_growth_inside_2: string;
  fee_growth_inside_a: string;
  fee_owed_a: string;
  fee_growth_inside_b: string;
  fee_owed_b: string;
  position_status: string;
}
