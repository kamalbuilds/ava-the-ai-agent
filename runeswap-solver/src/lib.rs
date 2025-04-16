// Basic module structure for RuneSwap Solver

// Module declarations
pub mod types;
pub mod config;
pub mod runeswap;
pub mod solver;

use std::error::Error;
use crate::config::Config;
use crate::runeswap::RuneSwapClient;

/// Main entry point for the RuneSwap NEAR Intents integration
pub struct RuneSwapSolver {
    /// Configuration for the solver
    pub config: Config,
    
    /// Client for interacting with RuneSwap API
    pub runeswap_client: RuneSwapClient,
}

impl RuneSwapSolver {
    /// Create a new RuneSwap solver instance
    pub fn new(config: Config) -> Self {
        let runeswap_client = RuneSwapClient::new(&config.runeswap_api_key);
        Self {
            config,
            runeswap_client,
        }
    }
    
    /// Initialize the solver with default configuration from environment variables
    pub fn init_default() -> Result<Self, Box<dyn Error>> {
        let config = Config::from_env()?;
        Ok(Self::new(config))
    }
}

/// Solver trait that will be implemented by different solver strategies
pub trait Solver {
    fn process_intent(&self) -> Result<(), Box<dyn std::error::Error>>;
    fn execute_swap(&self) -> Result<(), Box<dyn std::error::Error>>;
}

// Export modules (to be added in future commits) 