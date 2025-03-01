import { Wormhole } from "@wormhole-foundation/sdk";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import env from "../../../env";

/**
 * Gets a signer for a specific Wormhole chain
 * 
 * @param chain The Wormhole chain to get a signer for
 * @returns The signer for the chain
 */
export async function getSigner(chain: any): Promise<any> {
  console.log(`[getSigner] Getting signer for chain: ${chain.chain}`);
  
  try {
    // Get the private key from environment variables
    const privateKey = env.WALLET_PRIVATE_KEY || env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.error(`[getSigner] No private key found in environment variables`);
      throw new Error('Private key not found in environment variables');
    }
    
    console.log(`[getSigner] Private key available, creating signer`);
    
    // Format the private key properly (ensure it has the 0x prefix)
    const formattedPk = privateKey.startsWith('0x') 
      ? privateKey 
      : `0x${privateKey}`;
    
    // Create an account from the private key for logging purposes
    const account = privateKeyToAccount(formattedPk as `0x${string}`);
    console.log(`[getSigner] Account address: ${account.address}`);
    
    // Extract necessary information from the chain context
    const rpcUrl = chain.context?.rpc;
    console.log(`[getSigner] Using RPC URL: ${rpcUrl || 'Not available'}`);
    
    // Determine the appropriate viem chain based on the Wormhole chain
    let viemChain;
    if (chain.chain === 'BaseSepolia') {
      viemChain = baseSepolia;
      console.log(`[getSigner] Using BaseSepolia chain configuration`);
    } else {
      // Default to baseSepolia if no match (this is just a fallback)
      console.log(`[getSigner] No direct chain match for ${chain.chain}, defaulting to BaseSepolia`);
      viemChain = baseSepolia;
    }
    
    // Create a custom signer that implements the required interface
    const signer = {
      // For the chain() method, return the chain identifier
      chain: () => chain.chain,
      
      // Store the address as a property (for compatibility with some interfaces)
      address: account.address,
      
      // Add the getAddress method that the Wormhole SDK expects
      getAddress: async () => {
        console.log(`[getSigner:getAddress] Returning address: ${account.address}`);
        return account.address;
      },
      
      // Implement signAndSend for the SignAndSendSigner interface
      signAndSend: async (txs: any[]) => {
        console.log(`[getSigner:signAndSend] Signing and sending ${txs.length} transactions`);
        
        try {
          // Create a public client for estimating gas
          const publicClient = createPublicClient({
            chain: viemChain,
            transport: http(rpcUrl || viemChain.rpcUrls.default.http[0]),
          });
          
          // Create a wallet client for sending transactions
          const walletClient = createWalletClient({
            account,
            chain: viemChain,
            transport: http(rpcUrl || viemChain.rpcUrls.default.http[0]),
          });
          
          // Process each transaction
          const txHashes = [];
          for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            console.log(`[getSigner:signAndSend] Processing transaction ${i+1}/${txs.length}`);
            
            try {
              // Add more debug information
              console.log(`[getSigner:signAndSend] Transaction details:`, {
                to: tx.to,
                value: tx.value?.toString(),
                data: tx.data?.substring(0, 50) + (tx.data?.length > 50 ? '...' : ''),
                chainId: tx.chainId,
                gas: tx.gas,
                gasPrice: tx.gasPrice
              });
              
              // Prepare the transaction parameters
              const txParams = {
                to: tx.to as `0x${string}`,
                value: tx.value !== undefined ? BigInt(tx.value) : undefined,
                data: tx.data as `0x${string}`,
                // Other parameters if available
                nonce: tx.nonce,
              };
              
              console.log(`[getSigner:signAndSend] Prepared transaction params:`, {
                to: txParams.to,
                value: txParams.value?.toString(),
                dataLength: txParams.data?.length,
                nonce: txParams.nonce
              });
              
              // Send transaction using viem client
              const hash = await walletClient.sendTransaction(txParams);
              console.log(`[getSigner:signAndSend] Transaction sent successfully with hash: ${hash}`);
              txHashes.push(hash);
            } catch (txError) {
              console.error(`[getSigner:signAndSend] Error processing transaction ${i+1}:`, txError);
              throw txError;
            }
          }
          
          return txHashes;
        } catch (error) {
          console.error(`[getSigner:signAndSend] Error in signAndSend:`, error);
          throw error;
        }
      }
    };
    
    console.log(`[getSigner] Created custom signer for ${chain.chain}`);
    return signer;
  } catch (error) {
    console.error(`[getSigner] Error creating signer for chain ${chain.chain}:`, error);
    throw error;
  }
}