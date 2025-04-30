# Ref Finance Agent

This agent is part of the Ava Portfolio Manager AI Agent ecosystem and is responsible for interacting with the Ref Finance protocol on the NEAR blockchain.

## Overview

The Ref Finance Agent provides services for:
- Fetching liquidity pools information
- Getting token metadata and balances
- Executing token swaps with optimal routing
- Monitoring and analyzing prices and liquidity

## Features

- **Smart Routing**: Determines the optimal routes for token swaps to minimize slippage and maximize returns
- **Token Analytics**: Tracks token prices and provides historical data
- **Liquidity Monitoring**: Monitors liquidity pools and detects significant changes
- **Cross-chain Operations**: Supports operations across multiple chains through the Ava ecosystem

## Architecture

The agent consists of several key components:

### API Client

The `RefApiClient` class in `src/services/api-client.ts` serves as the interface to the Ref Finance API, providing methods for:
- Fetching pools and their details
- Retrieving token metadata
- Getting account balances
- Fetching token prices

### Components

React components in the `src/components` directory provide visual interfaces for:
- Viewing top liquidity pools
- Monitoring token prices
- Interacting with the swap functionality

### Types

The type definitions in the `src/types` directory ensure proper typing for:
- Token metadata and balances
- Network configurations
- Pool information

## Integration with Ava Ecosystem

This agent communicates with other Ava agents through:
1. The EventBus system for event-based communication
2. The A2A (Agent-to-Agent) protocol for standardized communication

## Development

### Prerequisites

- Node.js 16+
- Yarn or npm
- NEAR account (for testing transactions)

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/ava-portfolio-manager-ai-agent.git

# Navigate to agent directory
cd ava-portfolio-manager-ai-agent/near-ai-agents/ref-finance-agent

# Install dependencies
yarn install

# Start development server
yarn dev
```

### Configuration

Create a `.env` file with:

```
NEAR_NETWORK=mainnet  # or testnet
NEAR_ACCOUNT_ID=your-account.near
REF_FINANCE_API_BASE=https://api.ref.finance
```

## Usage

The agent exposes several methods that can be called by other agents:

```typescript
// Example: Swapping tokens using the Ref Finance agent
const refAgent = new RefFinanceAgent();

// Initialize the agent
await refAgent.initialize();

// Swap 10 NEAR for the equivalent amount of USDC
const result = await refAgent.swapTokens({
  accountId: 'your-account.near',
  privateKey: 'your-private-key',
  fromTokenId: 'near',
  toTokenId: 'usdc.near',
  amount: '10000000000000000000000000' // 10 NEAR (with 24 decimals)
});

console.log(`Received ${result.outputAmount} USDC`);
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](../../CONTRIBUTING.md) file for details on the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details. 