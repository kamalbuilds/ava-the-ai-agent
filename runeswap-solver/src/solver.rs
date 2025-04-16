// Implementation of the NEAR Intents solver

use crate::runeswap::RuneSwapClient;
use crate::types::{SwapIntent, SwapQuote, SwapStatus};
use async_trait::async_trait;
use futures_util::{SinkExt, StreamExt};
use std::error::Error;
use std::time::Duration;
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message, MaybeTlsStream, WebSocketStream};

/// Solver trait for implementing different solver strategies
#[async_trait]
pub trait Solver {
    async fn process_intent(&self, intent: &SwapIntent) -> Result<SwapQuote, Box<dyn Error>>;
    async fn execute_swap(&self, quote: &SwapQuote) -> Result<String, Box<dyn Error>>;
}

/// Solver for NEAR Intents protocol
pub struct NearIntentsSolver {
    account_id: String,
    private_key: String,
    solver_bus_url: String,
    runeswap_client: RuneSwapClient,
}

impl NearIntentsSolver {
    /// Create a new NEAR Intents solver
    pub fn new(
        account_id: String,
        private_key: String,
        solver_bus_url: String,
        runeswap_client: RuneSwapClient,
    ) -> Self {
        Self {
            account_id,
            private_key,
            solver_bus_url,
            runeswap_client,
        }
    }
    
    /// Start the solver and connect to the NEAR Intents bus
    pub async fn start(&self) -> Result<(), Box<dyn Error>> {
        log::info!("Connecting to solver bus at: {}", self.solver_bus_url);
        
        // Connect to the solver bus
        let (ws_stream, _) = match connect_async(&self.solver_bus_url).await {
            Ok(conn) => {
                log::info!("Connected to solver bus");
                conn
            },
            Err(e) => {
                log::error!("Failed to connect to solver bus: {}", e);
                return Err(Box::new(e));
            }
        };
        
        // Process messages from the bus
        self.process_messages(ws_stream).await?;
        
        Ok(())
    }
    
    /// Process messages from the WebSocket stream
    async fn process_messages(
        &self,
        mut ws_stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
    ) -> Result<(), Box<dyn Error>> {
        log::info!("Starting to process messages from solver bus");
        
        // Subscribe to intent messages
        let subscribe_msg = r#"{"jsonrpc":"2.0","id":1,"method":"subscribe","params":["intents"]}"#;
        ws_stream.send(Message::Text(subscribe_msg.to_string())).await?;
        
        // Set up a simple ping/pong interval to keep the connection alive
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        
        loop {
            tokio::select! {
                // Handle WebSocket messages
                msg = ws_stream.next() => {
                    match msg {
                        Some(Ok(Message::Text(text))) => {
                            log::debug!("Received message: {}", text);
                            // In a real implementation, we would parse and process the message
                            // For now, just log it
                        },
                        Some(Ok(Message::Ping(data))) => {
                            // Respond to ping with pong
                            if let Err(e) = ws_stream.send(Message::Pong(data)).await {
                                log::error!("Failed to send pong: {}", e);
                                break;
                            }
                        },
                        Some(Ok(Message::Close(_))) => {
                            log::info!("WebSocket connection closed by server");
                            break;
                        },
                        Some(Err(e)) => {
                            log::error!("WebSocket error: {}", e);
                            break;
                        },
                        None => {
                            log::error!("WebSocket stream ended unexpectedly");
                            break;
                        },
                        _ => { /* Ignore other message types */ }
                    }
                },
                
                // Send ping periodically to keep connection alive
                _ = interval.tick() => {
                    log::trace!("Sending ping");
                    if let Err(e) = ws_stream.send(Message::Ping(vec![])).await {
                        log::error!("Failed to send ping: {}", e);
                        break;
                    }
                }
            }
        }
        
        log::info!("Stopped processing messages from solver bus");
        Ok(())
    }
    
    /// Process an intent from the NEAR Intents protocol
    pub async fn process_intent(&self, intent: &SwapIntent) -> Result<SwapQuote, Box<dyn Error>> {
        log::info!("Processing intent: {} ({} -> {})", 
            intent.id, 
            intent.from_token.symbol, 
            intent.to_token.symbol);
            
        // Get a quote from RuneSwap
        let quote = self.runeswap_client.get_quote(intent).await?;
        
        log::info!("Quote received: amount_out={}, price={}", 
            quote.amount_out, 
            quote.price);
            
        Ok(quote)
    }
    
    /// Execute a swap based on a quote
    pub async fn execute_swap(&self, quote: &SwapQuote) -> Result<String, Box<dyn Error>> {
        log::info!("Executing swap for intent: {}", quote.intent_id);
        
        // Execute the swap through RuneSwap
        let tx_id = self.runeswap_client.execute_swap(quote).await?;
        
        log::info!("Swap executed successfully: {}", tx_id);
        
        Ok(tx_id)
    }
} 