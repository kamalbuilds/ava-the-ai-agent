# Nexus Bridge Agent

The Nexus Bridge Agent is designed to facilitate cross-chain token transfers using the Nexus Bridge protocol. It enables seamless movement of tokens between different blockchain networks through the Nexus Bridge infrastructure.

## Features

- **Send Tokens**: Transfer tokens from a source chain to a destination chain
- **Receive Tokens**: Complete the token transfer process on the destination chain
- **Verify Bridge Status**: Check the status of a bridge transaction

## Configuration

The agent requires the following configuration parameters:

```typescript
{
  privateKey: string;              // Private key for signing transactions
  sourceChainRpcUrl: string;       // RPC URL for the source chain
  destChainRpcUrl: string;         // RPC URL for the destination chain
  sourceBridgeAddress: string;     // Address of the bridge contract on the source chain
  destBridgeAddress: string;       // Address of the bridge contract on the destination chain
  sourceMailboxAddress: string;    // Address of the mailbox contract on the source chain
  destMailboxAddress: string;      // Address of the mailbox contract on the destination chain
  sourceProofManagerAddress: string; // Address of the proof manager contract on the source chain
  destProofManagerAddress: string; // Address of the proof manager contract on the destination chain
  sourceAppId: string;             // App ID for the source chain
  destAppId: string;               // App ID for the destination chain
  nexusRpcUrl: string;             // RPC URL for the Nexus service
}
```

## Environment Variables

The agent can be configured using the following environment variables:

- `NEXUS_BRIDGE_PRIVATE_KEY`: Private key for signing transactions
- `NEXUS_SOURCE_CHAIN_RPC_URL`: RPC URL for the source chain
- `NEXUS_DEST_CHAIN_RPC_URL`: RPC URL for the destination chain
- `NEXUS_SOURCE_BRIDGE_ADDRESS`: Address of the bridge contract on the source chain
- `NEXUS_DEST_BRIDGE_ADDRESS`: Address of the bridge contract on the destination chain
- `NEXUS_SOURCE_MAILBOX_ADDRESS`: Address of the mailbox contract on the source chain
- `NEXUS_DEST_MAILBOX_ADDRESS`: Address of the mailbox contract on the destination chain
- `NEXUS_SOURCE_PROOF_MANAGER_ADDRESS`: Address of the proof manager contract on the source chain
- `NEXUS_DEST_PROOF_MANAGER_ADDRESS`: Address of the proof manager contract on the destination chain
- `NEXUS_SOURCE_APP_ID`: App ID for the source chain
- `NEXUS_DEST_APP_ID`: App ID for the destination chain
- `NEXUS_RPC_URL`: RPC URL for the Nexus service

## Usage

The agent can be used to perform the following operations:

### Send Tokens

Send tokens from the source chain to the destination chain:

```
Send 10 TEST tokens to 0x1234...5678 on the destination chain
```

### Receive Tokens

Complete a token transfer on the destination chain:

```
Receive tokens for message ID 123 from block 456789
```

### Verify Bridge Status

Check the status of a bridge transaction:

```
Check the status of bridge transaction with message ID 123
```

## Architecture

The Nexus Bridge Agent is built on top of the Agent framework and integrates with the following components:

- **Nexus Client**: Communicates with the Nexus service
- **MailBox Client**: Interacts with the mailbox contracts
- **Proof Manager Client**: Manages proofs for cross-chain verification
- **ZKSync Verifier**: Verifies ZKSync proofs

## Dependencies

- ethers.js: For Ethereum interactions
- nexus-js: For Nexus protocol interactions

## Integration

The agent integrates with the task manager through the event bus, allowing it to receive tasks and report results back to the system. 