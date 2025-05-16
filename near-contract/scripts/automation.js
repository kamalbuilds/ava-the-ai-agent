// Automation script to increase contract interactions

const path = require('path');
const homedir = require('os').homedir();

const { 
    keyStores, 
    KeyPair, 
    connect, 
    utils
  } = require('near-api-js');
// Configuration for NEAR connection
const CREDENTIALS_DIR = '.near-credentials';
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'ping-pong.near';
const ACCOUNT_ID = process.env.ACCOUNT_ID || 'kamalwillwin.near'; 
const NETWORK_ID = process.env.NETWORK_ID || 'mainnet';
const AUTO_ITERATIONS = process.env.AUTO_ITERATIONS || 20;
const DELAY_BETWEEN_CALLS_MS = process.env.DELAY_BETWEEN_CALLS_MS || 600; // 5 seconds

// NEAR connection configuration
// const config = {
//   networkId: NETWORK_ID,
//   keyStore: new keyStores.UnencryptedFileSystemKeyStore(path.join(homedir, CREDENTIALS_DIR)),
//   nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
//   walletUrl: `https://wallet.${NETWORK_ID}.near.org`,
//   helperUrl: `https://helper.${NETWORK_ID}.near.org`,
//   explorerUrl: `https://explorer.${NETWORK_ID}.near.org`,
// };

// Function to wait for specified milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random greeting generator
function getRandomGreeting() {
  const greetings = [
    'Hello, NEAR world!',
    'Bonjour, monde NEAR!',
    'Hola, mundo NEAR!',
    'Ciao, mondo NEAR!',
    'Hallo, NEAR Welt!',
    'Olá, mundo NEAR!',
    'G\'day, NEAR world!',
    'Namaste, NEAR world!',
    'Привет, мир NEAR!',
    'こんにちは、NEARワールド！',
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// Random message generator
function getRandomMessage() {
  const messages = [
    'Just checking in!',
    'How\'s the network today?',
    'Ping from automation script',
    'Another day, another interaction',
    'Hello from the automation script',
    'Keeping the contract active',
    'Incrementing those metrics!',
    'More interactions, more rewards',
    'Hey contract, you there?',
    'Testing, testing, 123...',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

async function setupNear() {
    const keyStore = new keyStores.InMemoryKeyStore();
    
    // Add master account key
    // @ts-ignore - KeyPair.fromString expects KeyPairString but string works fine
    const masterKeyPair = KeyPair.fromString("ed25519:253Fnnu9TF28VWGZ2KoP5DumDuTfc3QPauZn5CgEV8viLj8MGSE3j1Z1zpS5ZaiidUJU8Ymi9MZNMYsAXeTxXW9P");
    await keyStore.setKey("mainnet", "kamalwillwin.near", masterKeyPair);
    
    const nearConfig = {
      networkId: "mainnet",
      keyStore,
      nodeUrl: "https://rpc.mainnet.near.org",
      walletUrl: "https://wallet.mainnet.near.org",
      helperUrl: "https://helper.mainnet.near.org",
    };
    
    return await connect(nearConfig);
  }

// Main function to execute contract interactions
async function runAutomation() {
  try {
    console.log(`Connecting to NEAR ${NETWORK_ID} network...`);
    
    // Connect to NEAR


    const near = await setupNear();
    
    // Get the master account
    const masterAccount = await near.account("kamalwillwin.near");
    console.log(`Using master account: kamalwillwin.near`);
    
    // Check if we have enough funds for our operations
    const masterAccountBalance = await masterAccount.getAccountBalance();
    const masterBalance = masterAccountBalance.available;
    const account = await near.account(ACCOUNT_ID);
    
    console.log(`Connected to account: ${ACCOUNT_ID}`);
    console.log(`Target contract: ${CONTRACT_NAME}`);
    console.log(`Running ${AUTO_ITERATIONS} iterations with ${DELAY_BETWEEN_CALLS_MS}ms delay between calls\n`);
    
    // Available contract methods to call
    const contractMethods = [
      { name: 'set_greeting', args: () => ({ greeting: getRandomGreeting() }) },
      { name: 'set_user_greeting', args: () => ({ greeting: getRandomGreeting() }) },
      { name: 'increment_interactions', args: () => ({}) },
      { name: 'ping_contract', args: () => ({ message: getRandomMessage() }) },
      { name: 'clear_greeting_history', args: () => ({}) },
    ];
    
    // Run multiple iterations
    for (let i = 0; i < AUTO_ITERATIONS; i++) {
      // Pick a random method
      const methodIndex = Math.floor(Math.random() * contractMethods.length);
      const method = contractMethods[methodIndex];
      
      console.log(`Iteration ${i+1}/${AUTO_ITERATIONS}: Calling ${method.name}...`);
      
      try {
        // Call the contract method
        const result = await account.functionCall({
          contractId: CONTRACT_NAME,
          methodName: method.name,
          args: method.args(),
          gas: '100000000000000', // 100 TGas
          attachedDeposit: '0', // No deposit
        });
        
        console.log(`✓ Success! Gas used: ${result.transaction.gas_burnt}`);
        
        // After each 3rd call, get stats from the contract
        if ((i + 1) % 3 === 0) {
          const stats = await account.viewFunction({
            contractId: CONTRACT_NAME,
            methodName: 'get_stats',
            args: {},
          });
          
          console.log(`\nCurrent Stats:`);
          console.log(`- Total interactions: ${stats.total_interactions}`);
          console.log(`- Unique contributors: ${stats.unique_contributors}`);
          console.log(`- Greeting history count: ${stats.greeting_history_count}\n`);
        }
      } catch (callError) {
        console.error(`Error calling ${method.name}:`, callError);
      }
      
      // Add delay between calls
      if (i < AUTO_ITERATIONS - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_CALLS_MS}ms before next call...\n`);
        await sleep(DELAY_BETWEEN_CALLS_MS);
      }
    }
    
    console.log('Automation completed!');
    
  } catch (error) {
    console.error('Error running automation:', error);
  }
}

// Start the automation
runAutomation(); 