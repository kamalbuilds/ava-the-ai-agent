#!/usr/bin/env node

// This script is designed to be run by a cron job to schedule regular contract interactions
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Number of interactions per run
  iterations: process.env.AUTO_ITERATIONS || 10,
  // Delay between calls in milliseconds
  delay: process.env.DELAY_BETWEEN_CALLS_MS || 3000,
  // Network to connect to (testnet or mainnet)
  network: process.env.NETWORK_ID || 'testnet',
  // Contract to interact with
  contract: process.env.CONTRACT_NAME,
  // Account to use for transactions
  account: process.env.ACCOUNT_ID,
  // Path to log file
  logPath: process.env.LOG_PATH || path.join(__dirname, '../logs'),
  // Whether to run in quiet mode (less verbose)
  quiet: process.env.QUIET === 'true'
};

// Create logs directory if it doesn't exist
if (!fs.existsSync(CONFIG.logPath)) {
  fs.mkdirSync(CONFIG.logPath, { recursive: true });
}

// Generate log file name with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(CONFIG.logPath, `automation-${timestamp}.log`);

// Open log file
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log with timestamp
function log(message) {
  const time = new Date().toISOString();
  const formattedMessage = `[${time}] ${message}`;
  
  if (!CONFIG.quiet) {
    console.log(formattedMessage);
  }
  
  logStream.write(formattedMessage + '\n');
}

// Run the automation script
function runAutomation() {
  log('Starting contract interaction automation run');
  
  // Validate required configuration
  if (!CONFIG.contract || !CONFIG.account) {
    log('ERROR: CONTRACT_NAME and ACCOUNT_ID environment variables must be set');
    process.exit(1);
  }

  const env = {
    ...process.env,
    CONTRACT_NAME: CONFIG.contract,
    ACCOUNT_ID: CONFIG.account,
    NETWORK_ID: CONFIG.network,
    AUTO_ITERATIONS: CONFIG.iterations,
    DELAY_BETWEEN_CALLS_MS: CONFIG.delay
  };
  
  log(`Configuration: ${JSON.stringify({
    contract: CONFIG.contract,
    account: CONFIG.account,
    network: CONFIG.network,
    iterations: CONFIG.iterations,
    delay: CONFIG.delay
  })}`);

  // Path to the automation script
  const scriptPath = path.join(__dirname, 'automation.js');
  
  // Spawn the automation script as a child process
  const child = spawn('node', [scriptPath], { 
    env,
    stdio: ['ignore', 'pipe', 'pipe'] 
  });

  // Handle stdout
  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        log(`[AUTOMATION] ${line}`);
      });
    }
  });

  // Handle stderr
  child.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        log(`[ERROR] ${line}`);
      });
    }
  });

  // Handle completion
  child.on('close', (code) => {
    log(`Automation process exited with code ${code}`);
    
    // Close the log file
    logStream.end();
    
    // Exit with the same code
    process.exit(code);
  });
}

// Start the automation
runAutomation(); 