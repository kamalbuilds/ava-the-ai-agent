import { connect, keyStores, utils, providers, transactions, KeyPair } from 'near-api-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { parseSeedPhrase } from 'near-seed-phrase';
dotenv.config();

// Define the KeyPairString type to match near-api-js expectations
type KeyPairString = string;

// Constants and configuration
const CONFIG = {
  networkId: 'mainnet', // or 'mainnet'
  nodeUrl: 'https://rpc.mainnet.near.org', // or 'https://rpc.mainnet.near.org' for mainnet
  masterAccountId: 'kamalwillwin.near',
  masterPrivateKey: '5KQEUGxgfsuJUDwrXbkzANCvbXQkwzTjKvHpZdbpozyAFmY3JFZobeXgNs7E2wH6LZNjgJnNpnMhqJ5m3BDL1jrb',
  tokenIds: [
    'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
    'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near', 
    '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near'
  ],
  walletInfoPath: './new_wallet_info.json',
  minAmountToTransfer: '0.01', // Minimum amount to transfer (in tokens)
  sleepBetweenTransfersMs: 1000, // Sleep 1 second between transfers to avoid rate limits
  rateLimit: 500, // milliseconds between API calls to avoid rate limiting
};

// Utility functions
function logMessage(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Interface for wallet info in JSON file
interface WalletInfo {
  accountId: string;
  seedPhrase: string;
  publicKey: string;
  private_key?: string; // May not be present in the file
}

// Read wallet info from file and extract private keys from seed phrases
function readWalletInfo(): WalletInfo[] {
  try {
    const filePath = path.resolve(CONFIG.walletInfoPath);
    const data = fs.readFileSync(filePath, 'utf8');
    const wallets: WalletInfo[] = JSON.parse(data);
    
    // Generate private keys from seed phrases if not already available
    return wallets.map(wallet => {
      if (!wallet.private_key && wallet.seedPhrase) {
        const { secretKey } = parseSeedPhrase(wallet.seedPhrase);
        return { ...wallet, private_key: secretKey };
      }
      return wallet;
    });
  } catch (error) {
    logMessage(`Error reading wallet info: ${error}`);
    return [];
  }
}

/**
 * Ensures private key has the required ed25519: prefix
 */
function ensureKeyPairFormat(privateKey: string): KeyPairString {
  if (!privateKey.startsWith('ed25519:')) {
    return `ed25519:${privateKey}` as KeyPairString;
  }
  return privateKey as KeyPairString;
}

// Get NEAR balance
async function getNearBalance(accountId: string, provider: providers.Provider): Promise<string> {
  try {
    const account = await provider.query({
      request_type: 'view_account',
      account_id: accountId,
      finality: 'final',
    }) as any; // Cast to any to avoid TypeScript errors
    
    return utils.format.formatNearAmount(account.amount);
  } catch (error) {
    logMessage(`Error getting NEAR balance for ${accountId}: ${error}`);
    return '0';
  }
}

// Get token balance for a specific token
async function getTokenBalance(
  accountId: string, 
  tokenId: string, 
  provider: providers.Provider
): Promise<string> {
  try {
    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenId,
      method_name: 'ft_balance_of',
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
      finality: 'final',
    }) as any; // Cast to any to avoid TypeScript errors

    const balance = JSON.parse(Buffer.from(result.result).toString());
    return utils.format.formatNearAmount(balance);
  } catch (error) {
    logMessage(`Error getting token balance for ${accountId} (${tokenId}): ${error}`);
    return '0';
  }
}

// Transfer NEAR
async function transferNear(
  fromAccountId: string,
  toAccountId: string,
  amount: string,
  keyStore: keyStores.KeyStore
): Promise<boolean> {
  try {
    const nearConnection = await connect({
      networkId: CONFIG.networkId,
      nodeUrl: CONFIG.nodeUrl,
      keyStore,
    });

    const account = await nearConnection.account(fromAccountId);
    const amountInYoctoNear = utils.format.parseNearAmount(amount);

    if (!amountInYoctoNear) {
      logMessage(`Invalid amount to transfer from ${fromAccountId} to ${toAccountId}: ${amount}`);
      return false;
    }

    const result = await account.sendMoney(toAccountId, BigInt(amountInYoctoNear));
    logMessage(`Successfully transferred ${amount} NEAR from ${fromAccountId} to ${toAccountId}. Hash: ${result.transaction.hash}`);
    return true;
  } catch (error) {
    logMessage(`Error transferring NEAR from ${fromAccountId} to ${toAccountId}: ${error}`);
    return false;
  }
}

// Transfer tokens
async function transferTokens(
  fromAccountId: string,
  toAccountId: string,
  tokenId: string,
  amount: string,
  keyStore: keyStores.KeyStore
): Promise<boolean> {
  try {
    const nearConnection = await connect({
      networkId: CONFIG.networkId,
      nodeUrl: CONFIG.nodeUrl,
      keyStore,
    });

    const account = await nearConnection.account(fromAccountId);
    const amountInYoctoNear = utils.format.parseNearAmount(amount);

    if (!amountInYoctoNear) {
      logMessage(`Invalid amount to transfer from ${fromAccountId} to ${toAccountId}: ${amount}`);
      return false;
    }

    // Transfer FT to recipient
    const result = await account.functionCall({
      contractId: tokenId,
      methodName: 'ft_transfer',
      args: {
        receiver_id: toAccountId,
        amount: amountInYoctoNear,
        memo: 'Transferred via script',
      },
      gas: BigInt('100000000000000'), // 100 TGas
      attachedDeposit: BigInt('1'), // 1 yoctoNEAR
    });

    logMessage(`Successfully transferred ${amount} ${tokenId} from ${fromAccountId} to ${toAccountId}. Hash: ${result.transaction.hash}`);
    return true;
  } catch (error) {
    logMessage(`Error transferring ${tokenId} from ${fromAccountId} to ${toAccountId}: ${error}`);
    return false;
  }
}

// Main function to transfer all tokens to master
async function transferAllTokensToMaster() {
  logMessage('Starting transfer of all tokens to master account...');

  // Connect to NEAR network
  const keyStore = new keyStores.InMemoryKeyStore();
  const config = {
    networkId: CONFIG.networkId,
    keyStore,
    nodeUrl: CONFIG.nodeUrl,
  };

  // Connect to the NEAR blockchain
  logMessage('Connecting to NEAR blockchain...');
  const nearConnection = await connect(config);
  
  // Set up the master account
  logMessage('Setting up master account...');
  const formattedMasterKey = ensureKeyPairFormat(CONFIG.masterPrivateKey);
  
  // Add master account key to keystore
  await keyStore.setKey(
    CONFIG.networkId,
    CONFIG.masterAccountId,
    KeyPair.fromString(formattedMasterKey as any)
  );

  // Create provider
  const provider = new providers.JsonRpcProvider({ url: CONFIG.nodeUrl });

  // Read wallet info
  const walletsInfo = readWalletInfo();
  logMessage(`Found ${walletsInfo.length} wallets to process`);

  if (walletsInfo.length === 0) {
    logMessage('No wallets found. Make sure the wallet info file exists and is properly formatted.');
    return;
  }

  // Process each wallet
  for (const walletInfo of walletsInfo) {
    try {
      const accountId = walletInfo.accountId;
      logMessage(`Processing account: ${accountId}`);

      // Generate or use existing private key
      if (!walletInfo.private_key) {
        logMessage(`No private key found for account ${accountId}, generating from seed phrase`);
        if (!walletInfo.seedPhrase) {
          logMessage(`No seed phrase found for account ${accountId}, skipping`);
          continue;
        }
        
        // Generate private key from seed phrase
        const { secretKey } = parseSeedPhrase(walletInfo.seedPhrase);
        walletInfo.private_key = secretKey;
      }
      
      const secretKey = walletInfo.private_key;
      const formattedSecretKey = ensureKeyPairFormat(secretKey);
      
      // Add account to keystore
      await keyStore.setKey(
        CONFIG.networkId,
        accountId,
        KeyPair.fromString(formattedSecretKey as any)
      );

      // Get NEAR balance
      const nearBalance = await getNearBalance(accountId, provider);
      logMessage(`NEAR balance for ${accountId}: ${nearBalance}`);

      // Transfer NEAR if above minimum and leaving some for gas
      if (parseFloat(nearBalance) > 0.01) {
        const amountToTransfer = (parseFloat(nearBalance) - 0.01).toFixed(5);
        logMessage(`Transferring ${amountToTransfer} NEAR from ${accountId} to ${CONFIG.masterAccountId}`);
        await transferNear(accountId, CONFIG.masterAccountId, amountToTransfer, keyStore);
        await sleep(CONFIG.sleepBetweenTransfersMs);
      } else {
        logMessage(`NEAR balance too low for ${accountId}, skipping transfer`);
      }

      // For each token, get balance and transfer if above minimum
      for (const tokenId of CONFIG.tokenIds) {
        const tokenBalance = await getTokenBalance(accountId, tokenId, provider);
        logMessage(`Token ${tokenId} balance for ${accountId}: ${tokenBalance}`);

        if (parseFloat(tokenBalance) > parseFloat(CONFIG.minAmountToTransfer)) {
          logMessage(`Transferring ${tokenBalance} ${tokenId} from ${accountId} to ${CONFIG.masterAccountId}`);
          await transferTokens(accountId, CONFIG.masterAccountId, tokenId, tokenBalance, keyStore);
          await sleep(CONFIG.sleepBetweenTransfersMs);
        } else {
          logMessage(`Token ${tokenId} balance too low for ${accountId}, skipping transfer`);
        }
      }
    } catch (error) {
      logMessage(`Error processing account ${walletInfo.accountId}: ${error}`);
    }
  }

  logMessage('Transfer process completed');
}

// Run the main function
transferAllTokensToMaster()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
  }); 