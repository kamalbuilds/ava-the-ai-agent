import { Wormhole } from "@wormhole-foundation/sdk";
import env from "../../../env";

/**
 * Gets a signer for a specific chain
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
    
    // Create the signer using the chain's native signer creation method
    const pkHex = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
    
    // Create a chain-specific native signer
    console.log(`[getSigner] Creating signer for chain: ${chain.chain}`);
    
    // Use the chain's context to create a signer
    const signer = await chain.getWallet({
      pk: pkHex
    });
    
    console.log(`[getSigner] Signer created successfully with address: ${signer.address?.address}`);
    
    return {
      signer: signer,
      address: signer.address
    };
  } catch (error) {
    console.error(`[getSigner] Error creating signer for chain ${chain.chain}:`, error);
    throw error;
  }
}