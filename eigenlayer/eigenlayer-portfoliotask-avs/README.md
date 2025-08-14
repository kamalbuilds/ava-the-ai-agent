# Portfolio Task AVS

Welcome to the Portfolio Task AVS. This project demonstrates a sophisticated decentralized portfolio validation system built on EigenLayer. It enables multiple operators to validate DeFi portfolio decisions through cryptographic consensus, ensuring security and trustworthiness in automated portfolio management.

This AVS is part of the **Ava Portfolio Manager** ecosystem, providing decentralized validation for AI-driven portfolio decisions.

## Architecture

![portfolio-task-avs](./assets/portfolio-task-diagramv2.png)

### Portfolio Validation Flow

1) **Portfolio Decision Request**: Ava Portfolio Manager requests validation for a portfolio decision (token allocation, strategy change, risk assessment).

2) **Task Creation**: PortfolioValidationServiceManager receives the request and emits a `NewPortfolioTask` event containing:
   - Token addresses and amounts
   - Strategy identifier  
   - Validation type (TokenEligibility, PortfolioBalance, or RiskAssessment)
   - Task metadata and hash

3) **Operator Validation**: All registered operators with sufficient stake receive the task and perform validation:
   - **Token Eligibility**: Verify tokens meet safety, liquidity, and compliance criteria
   - **Portfolio Balance**: Validate allocation percentages and risk distribution
   - **Risk Assessment**: Evaluate overall portfolio risk and strategy viability

4) **Cryptographic Consensus**: Each operator signs their validation result with their private key and submits it to the PortfolioValidationServiceManager.

5) **Validation Verification**: The contract verifies operator signatures and stake requirements before accepting submissions.

6) **Decision Execution**: Only portfolio decisions with sufficient operator consensus are executed by the Ava system.

This flow ensures that critical portfolio management decisions are validated by multiple independent operators, reducing risk and increasing trustworthiness.

## Key Components

### Smart Contracts

- **PortfolioValidationServiceManager**: Core AVS contract managing validation tasks and operator responses
- **PortfolioTask**: Defines task structure and validation strategies  
- **Token Registry**: Maintains token eligibility and metadata
- **Operator Registry**: Manages operator stakes and permissions

### Validation Types

```solidity
enum ValidationStrategy {
    TokenEligibility,    // Validate token safety and liquidity
    PortfolioBalance,    // Validate allocation and risk distribution  
    RiskAssessment       // Evaluate overall portfolio risk
}
```

### Portfolio Task Structure

```solidity
struct PortfolioTask {
    address[] tokens;              // Token addresses in portfolio
    uint256[] amounts;             // Token amounts
    string strategy;               // Strategy identifier
    TaskStatus status;             // Current task status
    uint256 createdAt;            // Task creation timestamp
    uint32 responses;             // Number of operator responses
    ValidationStrategy validationType; // Type of validation needed
    bytes32 taskHash;             // Hash of task data
}
```

## Benefits

- **Decentralized Validation**: No single point of failure in portfolio decisions
- **Cryptographic Security**: All validations are cryptographically signed and verified
- **Economic Incentives**: Operators are rewarded for accurate validations
- **Transparent History**: All portfolio validations are recorded on-chain
- **Risk Reduction**: Multiple operator consensus reduces risk of malicious decisions
- **AI Safety**: Provides a safety layer for AI-driven portfolio management

# Local Devnet Deployment

The following instructions explain how to deploy the Portfolio Task AVS from scratch including EigenLayer and AVS specific contracts using Foundry (forge) to a local anvil chain, and start the Typescript Operator application.

## Development Environment

### Non-Nix Environment
Install dependencies:

- [Node](https://nodejs.org/en/download/)
- [Typescript](https://www.typescriptlang.org/download)
- [ts-node](https://www.npmjs.com/package/ts-node)
- [tcs](https://www.npmjs.com/package/tcs#installation)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Foundry](https://getfoundry.sh/)
- [ethers](https://www.npmjs.com/package/ethers)

### Nix Environment 
On [Nix](https://nixos.org/) platforms, if you already have the proper Nix configuration, you can build the project's artifacts inside a `nix develop` shell
``` sh
nix develop
```

## Quick Start

### Start Anvil Chain

In terminal window #1, execute the following commands:

```sh
# Install npm packages
npm install

# Start local anvil chain
npm run start:anvil
```

### Deploy Contracts and Start Operator

Open a separate terminal window #2, execute the following commands

```sh
# Setup .env file
cp .env.example .env
cp contracts/.env.example contracts/.env

# Updates dependencies if necessary and builds the contracts 
npm run build

# Deploy the EigenLayer contracts
npm run deploy:core

# Deploy the Portfolio Task AVS contracts
npm run deploy:portfolio-task

# (Optional) Update ABIs
npm run extract:abis

# Start the Portfolio Validation Operator
npm run start:operator
```

### Create Portfolio Validation Tasks

Open a separate terminal window #3, execute the following commands

```sh
# Start creating portfolio validation tasks
npm run start:portfolio-tasks
```

## Portfolio Validation Examples

### Token Eligibility Validation
```typescript
// Example: Validate if tokens are eligible for portfolio inclusion
const tokens = ["0xA0b86a33E6441019d1E1e495e7eD1F5844Ac3A14", "0x..."];
const amounts = [1000000, 500000];
const strategy = "conservative_growth";

await portfolioValidationService.createPortfolioTask(
  tokens,
  amounts, 
  strategy,
  ValidationStrategy.TokenEligibility
);
```

### Portfolio Balance Validation  
```typescript
// Example: Validate portfolio allocation and risk distribution
await portfolioValidationService.createPortfolioTask(
  tokens,
  amounts,
  "balanced_allocation", 
  ValidationStrategy.PortfolioBalance
);
```

### Risk Assessment Validation
```typescript
// Example: Evaluate overall portfolio risk
await portfolioValidationService.createPortfolioTask(
  tokens,
  amounts,
  "high_yield_strategy",
  ValidationStrategy.RiskAssessment  
);
```

## Integration with Ava Portfolio Manager

This AVS integrates seamlessly with the Ava Portfolio Manager system:

1. **AI Decision Making**: Ava's AI agents create portfolio strategies
2. **Validation Request**: Critical decisions are sent to the Portfolio Task AVS
3. **Operator Consensus**: Multiple operators validate the portfolio decision
4. **Execution**: Only validated decisions are executed by Ava
5. **Monitoring**: All validations are tracked and can be queried via subgraph

## Operator Guide

### Becoming an Operator

1. **Stake Tokens**: Stake the required amount of tokens with EigenLayer
2. **Register**: Register as an operator with the PortfolioValidationServiceManager
3. **Run Software**: Deploy and run the portfolio validation operator software
4. **Validate**: Respond to portfolio validation tasks with signed responses

### Validation Responsibilities

Operators are responsible for:
- Evaluating token safety and liquidity (TokenEligibility)
- Analyzing portfolio risk distributions (PortfolioBalance)  
- Assessing overall strategy viability (RiskAssessment)
- Providing timely and accurate validations
- Maintaining high uptime and responsiveness

## Help and Support

For help and support deploying and modifying this repo for your portfolio validation needs:

1. Open a ticket via the intercom link at [support.eigenlayer.xyz](https://support.eigenlayer.xyz).
2. Include the necessary troubleshooting information for your environment:
  * Local anvil testing:
    * Redeploy your local test using `--revert-strings debug` flag
    * Include the full stacktrace from your error as a .txt file attachment
    * Create a minimal repo that demonstrates the behavior
    * Steps required to reproduce issue
  * Holesky testing:
    * Ensure contracts are verified on Holesky
    * Send us your transaction hash where your contract is failing

### Contact Us

If you're building a portfolio validation AVS and would like to speak with the EigenLayer DevRel team, please fill out this form: [EigenLayer AVS Intro Call](https://share.hsforms.com/1BksFoaPjSk2l3pQ5J4EVCAein6l)

## Disclaimers

- This repo is currently intended for _local anvil development testing_. Holesky deployment support will be added shortly.
- Users who wish to build a Portfolio Validation AVS for Production should consider migrating to a BLS style architecture using [RegistryCoordinator](https://github.com/Layr-Labs/eigenlayer-middleware/blob/dev/docs/RegistryCoordinator.md).

# Advanced Features

## Subgraph Integration

The Portfolio Task AVS includes a subgraph that indexes:
- Portfolio validation tasks and responses
- Token eligibility updates  
- Operator performance metrics
- Historical validation data

## Token Registry Management

Operators can update token eligibility data:
- Token safety assessments
- Liquidity analysis
- Compliance status
- Market risk factors

## Future Enhancements

The Portfolio Task AVS architecture can be enhanced with:
- Advanced risk models and scoring algorithms
- Machine learning integration for validation accuracy
- Cross-chain portfolio validation support
- Integration with additional DeFi protocols
- Real-time market data feeds for dynamic validation

## Testing

### Running Tests
```sh
# Deploy contracts locally
make deploy-eigenlayer-contracts
make deploy-portfolio-contracts

# Run test suite
cargo test --workspace
```

### Integration Testing
```sh
# Start local environment
npm run start:anvil

# Deploy and test full validation flow
npm run test:portfolio-validation
```