# API Reference

This document provides comprehensive documentation for all API endpoints available in the Ava Portfolio Manager system. The API follows RESTful principles and supports both HTTP and WebSocket communication.

## Base URLs

- **HTTP API**: `http://localhost:3020` (development)
- **WebSocket**: `ws://localhost:8020` (development)
- **Production**: Contact your system administrator for production URLs

## Authentication

The API uses multiple authentication methods depending on the endpoint:

- **Wallet Authentication**: For user-specific operations
- **API Keys**: For third-party integrations
- **Agent-to-Agent (A2A)**: For inter-agent communication

### Wallet Authentication

```typescript
// Headers for wallet-authenticated requests
{
  "Authorization": "Bearer <wallet_signature>",
  "Content-Type": "application/json"
}
```

### API Key Authentication

```typescript
// Headers for API key authentication
{
  "X-API-Key": "<your_api_key>",
  "Content-Type": "application/json"
}
```

## Core API Endpoints

### Health and Status

#### GET /health

Health check endpoint for monitoring service status.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200`: Service is healthy
- `503`: Service is unavailable

#### GET /v1/

Get basic API information and version.

**Response:**
```json
{
  "message": "Atoma Agents API",
  "version": "1.0.0"
}
```

#### GET /v1/health

V1 API health check endpoint.

**Response:**
```json
{
  "msg": "ok"
}
```

## Agent Communication (A2A Protocol)

The A2A (Agent-to-Agent) protocol enables standardized communication between agents in the system.

### Agent Discovery

#### GET /agent/{agentName}/.well-known/agent.json

Get agent metadata and capabilities.

**Parameters:**
- `agentName` (path): Name of the agent (`observer`, `executor`, `swap`, `sxt-analytics`)

**Response:**
```json
{
  "id": "agent-id",
  "name": "Agent Name",
  "version": "1.0.0",
  "description": "Agent description",
  "capabilities": [
    "portfolio_analysis",
    "trade_execution",
    "risk_assessment"
  ],
  "endpoints": {
    "tasks": "/agent/{agentName}/tasks",
    "status": "/agent/{agentName}/tasks/{taskId}"
  }
}
```

### Task Management

#### POST /agent/{agentName}/tasks/send

Send a task to a specific agent.

**Parameters:**
- `agentName` (path): Target agent name

**Request Body:**
```json
{
  "task": "Analyze my portfolio risk",
  "type": "analysis",
  "priority": "normal",
  "deadline": "2024-01-01T12:00:00Z",
  "parameters": {
    "walletAddress": "0x...",
    "timeframe": "30d"
  }
}
```

**Response:**
```json
{
  "taskId": "task-uuid-123",
  "status": "accepted",
  "estimatedCompletion": "2024-01-01T12:05:00Z",
  "agent": "observer"
}
```

#### GET /agent/{agentName}/tasks/{taskId}

Get task status and results.

**Parameters:**
- `agentName` (path): Agent name
- `taskId` (path): Task identifier

**Response:**
```json
{
  "taskId": "task-uuid-123",
  "status": "completed",
  "result": {
    "type": "portfolio_analysis",
    "data": {
      "riskScore": 0.65,
      "recommendations": [
        "Diversify holdings",
        "Reduce exposure to high-risk assets"
      ]
    }
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:04:32Z"
}
```

#### POST /agent/{agentName}/tasks/{taskId}/cancel

Cancel a pending task.

**Parameters:**
- `agentName` (path): Agent name
- `taskId` (path): Task identifier

**Response:**
```json
{
  "taskId": "task-uuid-123",
  "status": "cancelled",
  "cancelledAt": "2024-01-01T12:02:15Z"
}
```

## Swap API (0x Integration)

The Swap API provides token swapping capabilities using 0x protocol integration.

### Price Quotes

#### GET /0x/price

Get price information for a token swap without committing to a trade.

**Query Parameters:**
- `sellToken` (required): Token address or symbol to sell
- `buyToken` (required): Token address or symbol to buy
- `sellAmount` (optional): Amount to sell (in token units)
- `buyAmount` (optional): Amount to buy (in token units)
- `chainId` (optional): Blockchain network ID (default: 8453 for Base)
- `takerAddress` (optional): Address that will make the trade

**Note:** Either `sellAmount` or `buyAmount` must be specified.

**Example Request:**
```
GET /0x/price?sellToken=USDC&buyToken=ETH&sellAmount=1000000000&takerAddress=0x123...
```

**Response:**
```json
{
  "price": "0.00032",
  "estimatedPriceImpact": "0.01",
  "buyAmount": "320000000000000",
  "sellAmount": "1000000000",
  "sources": [
    {
      "name": "Uniswap_V3",
      "proportion": "1.0"
    }
  ],
  "gasPrice": "1000000000",
  "estimatedGas": "150000"
}
```

#### GET /0x/quote

Get a firm quote for a token swap that can be used for execution.

**Query Parameters:**
- `sellToken` (required): Token address or symbol to sell
- `buyToken` (required): Token address or symbol to buy
- `sellAmount` (optional): Amount to sell (in token units)
- `buyAmount` (optional): Amount to buy (in token units)
- `takerAddress` (required): Address that will make the trade
- `chainId` (optional): Blockchain network ID
- `slippagePercentage` (optional): Maximum slippage percentage (e.g., "0.01" for 1%)

**Example Request:**
```
GET /0x/quote?sellToken=USDC&buyToken=ETH&sellAmount=1000000000&takerAddress=0x123...&slippagePercentage=0.005
```

**Response:**
```json
{
  "price": "0.00032",
  "buyAmount": "320000000000000",
  "sellAmount": "1000000000",
  "to": "0x...",
  "data": "0x...",
  "value": "0",
  "gas": "150000",
  "gasPrice": "1000000000",
  "protocolFee": "0",
  "minimumProtocolFee": "0",
  "sources": [
    {
      "name": "Uniswap_V3",
      "proportion": "1.0"
    }
  ],
  "allowanceTarget": "0x...",
  "decodedUniqueId": "...",
  "buyTokenAddress": "0x...",
  "sellTokenAddress": "0x..."
}
```

### Token Information

#### GET /0x/token/{tokenAddress}

Get information about a specific token.

**Parameters:**
- `tokenAddress` (path): Token contract address

**Response:**
```json
{
  "address": "0x...",
  "isNative": false,
  "isWrappedEth": true,
  "nativeTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "wrappedEthAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
}
```

## Zora Coins API

The Zora Coins API provides access to Zora's token ecosystem and trading functionality.

### GET /api/zora/coins

Get list of Zora coins with optional filtering.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `search` (optional): Search term for coin name or symbol
- `sortBy` (optional): Sort field (`market_cap`, `volume`, `created_at`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "coins": [
    {
      "id": "coin-id",
      "name": "Coin Name",
      "symbol": "SYMBOL",
      "address": "0x...",
      "marketCap": "1000000",
      "volume24h": "50000",
      "price": "0.10",
      "priceChange24h": "5.2",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### GET /api/zora/coins/{coinId}

Get detailed information about a specific Zora coin.

**Parameters:**
- `coinId` (path): Coin identifier or contract address

**Response:**
```json
{
  "id": "coin-id",
  "name": "Coin Name",
  "symbol": "SYMBOL",
  "address": "0x...",
  "description": "Coin description",
  "marketCap": "1000000",
  "volume24h": "50000",
  "price": "0.10",
  "priceChange24h": "5.2",
  "holders": 1234,
  "totalSupply": "10000000",
  "circulatingSupply": "8000000",
  "createdAt": "2024-01-01T00:00:00Z",
  "creator": "0x...",
  "verified": true
}
```

## Query API (Blockchain Data)

The Query API provides access to blockchain data and analytics.

### POST /v1/query

Execute a natural language query against blockchain data.

**Request Body:**
```json
{
  "query": "What is the current price of SUI and BTC?",
  "context": {
    "walletAddress": "0x...",
    "timeframe": "24h"
  }
}
```

**Response:**
```json
{
  "result": {
    "type": "price_data",
    "data": {
      "SUI": {
        "price": "2.45",
        "change24h": "3.2%",
        "volume": "150000000"
      },
      "BTC": {
        "price": "45000.00",
        "change24h": "-1.8%",
        "volume": "25000000000"
      }
    }
  },
  "queryId": "query-uuid-123",
  "processedAt": "2024-01-01T12:00:00Z",
  "processingTime": "1.2s"
}
```

### GET /v1/query/health

Health check for the query service.

**Response:**
```json
{
  "status": "healthy"
}
```

## WebSocket API

The WebSocket API provides real-time communication for live updates and agent interactions.

### Connection

Connect to the WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:8020');
```

### Message Types

#### Connection Established

Sent when a client successfully connects:

```json
{
  "type": "connection-established",
  "timestamp": "12:00:00 PM"
}
```

#### Agent Messages

Real-time messages from agents:

```json
{
  "type": "agent-message",
  "timestamp": "12:00:00 PM",
  "role": "assistant",
  "content": "Portfolio analysis complete. Risk score: 0.65",
  "agentName": "observer",
  "collaborationType": "analysis"
}
```

#### Agent Actions

Notifications of agent actions:

```json
{
  "type": "agent-action",
  "timestamp": "12:00:00 PM",
  "data": {
    "action": "swap_executed",
    "agent": "swap",
    "details": {
      "fromToken": "USDC",
      "toToken": "ETH",
      "amount": "1000",
      "transactionHash": "0x..."
    }
  }
}
```

#### Position Updates

Real-time portfolio position updates:

```json
{
  "type": "position-update",
  "timestamp": "12:00:00 PM",
  "data": {
    "walletAddress": "0x...",
    "positions": [
      {
        "token": "ETH",
        "balance": "2.5",
        "value": "8000.00",
        "change24h": "3.2%"
      }
    ]
  }
}
```

#### Task Updates

Real-time task status updates:

```json
{
  "type": "task-update",
  "timestamp": "12:00:00 PM",
  "data": {
    "taskId": "task-uuid-123",
    "status": "in_progress",
    "progress": "75%",
    "estimatedCompletion": "2024-01-01T12:05:00Z"
  }
}
```

## Error Handling

### Standard Error Response

All API endpoints return errors in a standardized format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "req-uuid-123"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error
- `502`: Bad Gateway - Upstream service error
- `503`: Service Unavailable - Service temporarily unavailable

### Common Error Codes

- `INVALID_PARAMETERS`: Request parameters are invalid
- `WALLET_NOT_CONNECTED`: Wallet authentication required
- `INSUFFICIENT_BALANCE`: Insufficient token balance for operation
- `SLIPPAGE_EXCEEDED`: Transaction slippage exceeds limits
- `NETWORK_ERROR`: Blockchain network connectivity issue
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `AGENT_UNAVAILABLE`: Requested agent is not available
- `TASK_NOT_FOUND`: Task ID not found
- `QUOTE_EXPIRED`: Price quote has expired

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **General endpoints**: 100 requests per minute per IP
- **Trading endpoints**: 30 requests per minute per wallet
- **Query endpoints**: 50 requests per minute per API key
- **WebSocket connections**: 10 concurrent connections per IP

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDK and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @ava-portfolio/sdk
```

```typescript
import { AvaPortfolioSDK } from '@ava-portfolio/sdk';

const sdk = new AvaPortfolioSDK({
  apiUrl: 'http://localhost:3020',
  apiKey: 'your-api-key'
});

// Get portfolio analysis
const analysis = await sdk.agents.observer.analyzePortfolio({
  walletAddress: '0x...'
});

// Execute a swap
const swap = await sdk.agents.swap.executeSwap({
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: '1000'
});
```

### Python SDK

```bash
pip install ava-portfolio-sdk
```

```python
from ava_portfolio import AvaPortfolioSDK

sdk = AvaPortfolioSDK(
    api_url='http://localhost:3020',
    api_key='your-api-key'
)

# Get portfolio analysis
analysis = sdk.agents.observer.analyze_portfolio(
    wallet_address='0x...'
)

# Execute a swap
swap = sdk.agents.swap.execute_swap(
    from_token='USDC',
    to_token='ETH',
    amount='1000'
)
```

## Testing

### Postman Collection

A comprehensive Postman collection is available for testing all API endpoints:

1. Import the collection from `/docs/postman/ava-portfolio-api.json`
2. Set up environment variables:
   - `base_url`: API base URL
   - `api_key`: Your API key
   - `wallet_address`: Your wallet address

### cURL Examples

#### Get Portfolio Analysis

```bash
curl -X POST "http://localhost:3020/agent/observer/tasks/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "task": "Analyze my portfolio risk",
    "type": "analysis",
    "parameters": {
      "walletAddress": "0x...",
      "timeframe": "30d"
    }
  }'
```

#### Get Token Price

```bash
curl -X GET "http://localhost:3020/0x/price?sellToken=USDC&buyToken=ETH&sellAmount=1000000000" \
  -H "Content-Type: application/json"
```

#### Execute Swap Quote

```bash
curl -X GET "http://localhost:3020/0x/quote?sellToken=USDC&buyToken=ETH&sellAmount=1000000000&takerAddress=0x...&slippagePercentage=0.005" \
  -H "Content-Type: application/json"
```

## Webhooks

Configure webhooks to receive real-time notifications about important events.

### Webhook Configuration

```json
{
  "url": "https://your-server.com/webhooks/ava",
  "events": [
    "swap.completed",
    "portfolio.analysis_complete",
    "risk.threshold_exceeded",
    "task.completed"
  ],
  "secret": "webhook-secret-key"
}
```

### Webhook Payload

```json
{
  "event": "swap.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "transactionHash": "0x...",
    "fromToken": "USDC",
    "toToken": "ETH",
    "amount": "1000",
    "walletAddress": "0x..."
  },
  "signature": "sha256=..."
}
```

## Environment Variables

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development
HTTP_PORT=3020
WS_PORT=8020
API_BASE_URL=http://localhost:3020

# Wallet Configuration
WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...

# AI Providers
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# API Keys
ZERION_API_KEY=...
BRIAN_API_KEY=...
COOKIE_API_KEY=...
STORY_PROTOCOL_API_KEY=...

# Blockchain Configuration
CHAIN_ID=8453
RPC_PROVIDER_URL=https://base.llamarpc.com
```

### Optional Environment Variables

```bash
# Advanced Configuration
DEFAULT_AI_PROVIDER=openai
ENABLE_PRIVATE_COMPUTE=false
STORAGE_TYPE=hybrid

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Support and Documentation

### Additional Resources

- **Developer Guide**: `/docs/developers/getting-started.md`
- **Architecture Overview**: `/docs/architecture/overview.md`
- **Security Guidelines**: `/docs/security/best-practices.md`
- **Troubleshooting**: `/docs/support/troubleshooting.md`

### Support Channels

- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join our developer community
- **Email**: support@ava-portfolio.com
- **Documentation**: https://docs.ava-portfolio.com

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Agent-to-Agent communication protocol
- 0x swap integration
- Zora coins support
- WebSocket real-time updates
- Comprehensive error handling
- Rate limiting implementation

### Upcoming Features

- **v1.1.0**: Cross-chain swap support
- **v1.2.0**: Advanced portfolio analytics
- **v1.3.0**: Options and derivatives trading
- **v2.0.0**: GraphQL API interface
