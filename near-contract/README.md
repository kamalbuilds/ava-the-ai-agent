# Enhanced NEAR Smart Contract with Automation

This project contains an enhanced NEAR smart contract with multiple functions designed to increase on-chain interactions, along with an automation script to regularly call these functions.

## Contract Features

The enhanced contract includes these features:
- Basic greeting functionality (get/set)
- User-specific greetings
- Greeting history tracking
- Interaction statistics
- Cross-contract calls
- Interaction counting

## Prerequisites

1. [NEAR CLI](https://docs.near.org/tools/near-cli#installation) installed
2. NEAR account (testnet or mainnet)
3. Node.js and npm/yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the contract:
```bash
npm run build
```

3. Deploy the contract (make sure you're logged in with NEAR CLI):
```bash
near deploy --wasmFile build/contract.wasm --accountId YOUR_ACCOUNT.testnet
```

4. Initialize the contract (if deploying for the first time):
```bash
near call YOUR_ACCOUNT.testnet init '{}' --accountId YOUR_ACCOUNT.testnet
```

## Interacting with the Contract

### Basic Interactions
```bash
# Get the current greeting
near view YOUR_ACCOUNT.testnet get_greeting '{}'

# Set a new greeting
near call YOUR_ACCOUNT.testnet set_greeting '{"greeting":"Hello NEAR World!"}' --accountId YOUR_ACCOUNT.testnet

# Get greeting history
near view YOUR_ACCOUNT.testnet get_greeting_history '{}'

# Set user-specific greeting
near call YOUR_ACCOUNT.testnet set_user_greeting '{"greeting":"My personal greeting"}' --accountId YOUR_ACCOUNT.testnet

# Get user-specific greeting
near view YOUR_ACCOUNT.testnet get_user_greeting '{"user_id":"USER_ACCOUNT.testnet"}'

# Get your own greeting
near view YOUR_ACCOUNT.testnet get_user_greeting_for_caller '{}' --accountId YOUR_ACCOUNT.testnet
```

### Statistics and Utilities
```bash
# Get interaction statistics
near view YOUR_ACCOUNT.testnet get_stats '{}'

# Increment interaction count
near call YOUR_ACCOUNT.testnet increment_interactions '{}' --accountId YOUR_ACCOUNT.testnet

# Clear greeting history
near call YOUR_ACCOUNT.testnet clear_greeting_history '{}' --accountId YOUR_ACCOUNT.testnet

# Ping the contract
near call YOUR_ACCOUNT.testnet ping_contract '{"message":"Hello there!"}' --accountId YOUR_ACCOUNT.testnet
```

## Using the Automation Script

The automation script will randomly call different contract functions to increase interaction count.

### Configuration

Set environment variables or edit the script directly to configure:
- `CONTRACT_NAME`: Your deployed contract account ID
- `ACCOUNT_ID`: The account used to sign transactions
- `NETWORK_ID`: Network to connect to (`testnet` or `mainnet`)
- `AUTO_ITERATIONS`: Number of function calls to make
- `DELAY_BETWEEN_CALLS_MS`: Delay between calls in milliseconds

### Running the Script

```bash
# Make sure you're logged in with NEAR CLI first
near login

# Run with default settings
npm run automate

# Or run with explicit network
npm run automate:testnet

# Or with environment variables
CONTRACT_NAME=your-contract.testnet ACCOUNT_ID=your-account.testnet AUTO_ITERATIONS=50 npm run automate
```

## Scheduling Regular Interactions with Cron

To maximize your contract interactions, you can set up a cron job to run the automation script regularly.

### Using the Cron Script

The project includes a cron-friendly script that can be scheduled to run at regular intervals:

```bash
# Run the cron script directly
npm run cron

# Or with specific network
npm run cron:testnet

# Or with full configuration
CONTRACT_NAME=your-contract.testnet ACCOUNT_ID=your-account.testnet AUTO_ITERATIONS=15 npm run cron
```

### Setting Up a System Cron Job

1. Edit your crontab:
```bash
crontab -e
```

2. Add an entry to run the script at your desired frequency (e.g., every 4 hours):
```
# Run contract automation every 4 hours
0 */4 * * * cd /path/to/near-contract && CONTRACT_NAME=your-contract.testnet ACCOUNT_ID=your-account.testnet npm run cron
```

3. For more detailed logging, you can specify a custom log path:
```
0 */4 * * * cd /path/to/near-contract && CONTRACT_NAME=your-contract.testnet ACCOUNT_ID=your-account.testnet LOG_PATH=/var/log/near-automation npm run cron
```

The script will:
- Create timestamped log files for each run
- Execute randomly selected contract functions
- Track statistics for interactions

### Configuration Options

The cron script supports these environment variables:
- `CONTRACT_NAME`: Your contract account ID
- `ACCOUNT_ID`: Account used to sign transactions 
- `NETWORK_ID`: Network to connect to (`testnet` or `mainnet`)
- `AUTO_ITERATIONS`: Number of interactions per run
- `DELAY_BETWEEN_CALLS_MS`: Delay between calls in milliseconds
- `LOG_PATH`: Directory to store log files
- `QUIET`: Set to 'true' for less verbose output

## Why This Helps

The onchain_offchain_data.py script used for rewards calculation counts contract interactions when:
- A transaction has actions with "FUNCTION_CALL" type
- The function calls modify the contract state

By running the automation script regularly, you'll increase your contract interactions, which is one of the key metrics used in the rewards calculation.

## Customization

You can customize the automation script to call different functions or adjust the frequency of calls. Feel free to modify the `contractMethods` array in the script to add or remove functions.