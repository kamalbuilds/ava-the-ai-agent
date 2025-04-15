// Basic type definitions for the RuneSwap solver

use serde::{Deserialize, Serialize};

/// Represents a token with its details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub symbol: String,
    pub address: String,
    pub decimals: u8,
}

/// Represents a swap intent from the NEAR protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapIntent {
    pub id: String,
    pub from_token: Token,
    pub to_token: Token,
    pub amount: String,
    pub min_amount_out: String,
    pub deadline: u64,
}

/// Represents a swap quote from RuneSwap
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapQuote {
    pub intent_id: String,
    pub amount_out: String,
    pub price: String,
    pub gas_estimate: u64,
}

/// Status of a swap execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SwapStatus {
    Pending,
    Executed,
    Failed,
} 