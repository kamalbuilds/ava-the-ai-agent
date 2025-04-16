use runeswap_solver::RuneSwapSolver;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("RuneSwap Solver - NEAR Intents Integration");
    
    // Initialize the solver with configuration from environment variables
    let solver = match RuneSwapSolver::init_default() {
        Ok(solver) => {
            println!("Solver initialized successfully");
            solver
        },
        Err(e) => {
            eprintln!("Failed to initialize solver: {}", e);
            eprintln!("Make sure all required environment variables are set");
            return Err(e);
        }
    };
    
    // In future versions, we'll add proper startup logic here
    println!("Using RuneSwap API key: {}", mask_api_key(&solver.config.runeswap_api_key));
    println!("Using NEAR account ID: {}", solver.config.near_account_id);
    
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