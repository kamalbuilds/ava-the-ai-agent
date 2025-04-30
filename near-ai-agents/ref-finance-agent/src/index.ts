import { RefFinanceAgent } from './agent';
import { NearConfig } from './types';

// Export main classes and types
export { RefFinanceAgent } from './agent';
export { RefApiClient } from './services/api-client';
export { TokenService } from './services/token-service';
export { PoolService } from './services/pool-service';
export { SwapService } from './services/swap-service';
export * from './types';
export * from './utils/config';

/**
 * Create a new Ref Finance agent instance
 * @param networkId The NEAR network ID ('mainnet' or 'testnet')
 * @param agentId Optional custom agent ID
 * @returns A new RefFinanceAgent instance
 */
export function createRefFinanceAgent(networkId: string = 'mainnet', agentId?: string): RefFinanceAgent {
  return new RefFinanceAgent(networkId, agentId);
}

/**
 * Create a new Ref Finance agent with custom configuration
 * @param config Custom NEAR configuration
 * @param agentId Optional custom agent ID
 * @returns A new RefFinanceAgent instance
 */
export function createRefFinanceAgentWithConfig(config: NearConfig, agentId?: string): RefFinanceAgent {
  const agent = new RefFinanceAgent(config.networkId, agentId);
  // Override default config with custom values
  // Note: This is a partial implementation, as we'd need to modify RefFinanceAgent
  // to accept a custom config directly. For now, we're just returning a standard agent.
  return agent;
}

// If this script is run directly
if (require.main === module) {
  const networkId = process.env.NEAR_NETWORK_ID || 'mainnet';
  const agent = createRefFinanceAgent(networkId);
  
  // Initialize the agent
  agent.initialize().then(() => {
    console.log(`Ref Finance Agent initialized on ${networkId}`);
    console.log(`Agent ID: ${agent.getId()}`);
    console.log('Ready to receive A2A messages');
  }).catch(error => {
    console.error('Failed to initialize agent:', error);
    process.exit(1);
  });
} 