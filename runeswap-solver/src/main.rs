use runeswap_solver::RuneSwapSolver;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    
    log::info!("RuneSwap Solver - NEAR Intents Integration");
    
    // Initialize the solver with configuration from environment variables
    let solver = match RuneSwapSolver::init_default() {
        Ok(solver) => {
            log::info!("Solver initialized successfully");
            solver
        },
        Err(e) => {
            log::error!("Failed to initialize solver: {}", e);
            log::error!("Make sure all required environment variables are set");
            return Err(e);
        }
    };
    
    // Log configuration details (with sensitive data masked)
    log::info!("Using RuneSwap API key: {}", mask_api_key(&solver.config.runeswap_api_key));
    log::info!("Using NEAR account ID: {}", solver.config.near_account_id);
    log::info!("Connecting to solver bus: {}", solver.config.solver_bus_url);
    
    // Start the solver service
    if let Err(e) = solver.start().await {
        log::error!("Fatal error: {}", e);
        log::error!("RuneSwap solver terminated unexpectedly");
        return Err(e);
    }
    
    log::info!("RuneSwap solver shutdown complete");
    Ok(())
}

// Utility function to mask API key for logging
fn mask_api_key(api_key: &str) -> String {
    if api_key.len() <= 8 {
        return "****".to_string();
    }
    
    let visible_chars = 4;
    format!("{}****{}", 
        &api_key[0..visible_chars], 
        &api_key[api_key.len() - visible_chars..])
} 