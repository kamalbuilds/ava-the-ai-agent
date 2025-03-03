import { ethers } from "ethers";
import { NexusBridgeAgent } from "..";
// @ts-ignore
import { getStorageLocationForReceipt } from "nexus-js";

export interface ReceiveTokenParams {
  messageId: string;
  blockNumber: number;
}

/**
 * Action to receive tokens on destination chain that were sent from source chain
 * @param agent The Nexus Bridge Agent instance
 * @param params Parameters for the receive token operation
 * @returns Result of the operation
 */
export async function receiveTokenAction(
  agent: NexusBridgeAgent,
  params: ReceiveTokenParams
): Promise<any> {
  try {
    const { messageId, blockNumber } = params;
    
    // Get source chain provider and bridge contract
    const sourceBridgeContract = await agent.getSourceBridgeContract();
    
    // Get message hash from bridge contract
    const messageHash = await sourceBridgeContract.isSent(messageId);
    if (!messageHash || messageHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      throw new Error(`No message found with ID ${messageId}`);
    }
    
    console.log(`[NexusBridge] Found message hash: ${messageHash}`);
    
    // Get Nexus client for source chain
    const nexusClient = await agent.getNexusClient(
      (await agent.getZKSyncVerifier()).getSourceAppId()
    );
    
    // Wait for the block to be processed by Nexus
    console.log(`[NexusBridge] Waiting for block ${blockNumber} to be processed by Nexus...`);
    const accountDetails = await waitForUpdateOnNexus(nexusClient, blockNumber);
    console.log(`[NexusBridge] Block processed by Nexus`);
    
    // Get proof manager client for destination chain
    const proofManagerClient = await agent.getProofManagerClient(false);
    
    // Update Nexus block on destination chain
    await proofManagerClient.updateNexusBlock(
      accountDetails.response.nexus_header.number,
      `0x${accountDetails.response.nexus_header.state_root}`,
      `0x${accountDetails.response.nexus_header.avail_header_hash}`,
      "" // Proof will be added by the prover
    );
    console.log(`[NexusBridge] Updated Nexus Block on destination chain`);
    
    // Wait for the update to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update chain state on destination chain
    await proofManagerClient.updateChainState(
      accountDetails.response.nexus_header.number,
      accountDetails.response.proof,
      (await agent.getZKSyncVerifier()).getSourceAppId(),
      accountDetails.response.account
    );
    console.log(`[NexusBridge] Updated Chain State on destination chain`);
    
    // Get mailbox contract on source chain
    const sourceMailboxClient = await agent.getMailboxClient(true);
    const mailboxContract = sourceMailboxClient.getContract();
    
    // Get message details from mailbox contract
    const messageDetails = await mailboxContract.getSendMessage(messageHash);
    console.log(`[NexusBridge] Retrieved message details from source chain`);
    
    // Get storage slot for the receipt
    const storageSlot = getStorageLocationForReceipt(messageHash);
    
    // Get ZKSync verifier
    const zksyncVerifier = await agent.getZKSyncVerifier();
    
    // Get proof for the message
    const proof = await zksyncVerifier.getReceiveMessageProof(
      accountDetails.response.account.height,
      messageDetails,
      {
        storageKey: storageSlot.toString()
      }
    );
    console.log(`[NexusBridge] Generated proof for message`);
    
    // Encode the proof
    const proofEncoded = zksyncVerifier.encodeMessageProof(proof);
    
    // Get mailbox client for destination chain
    const destMailboxClient = await agent.getMailboxClient(false);
    const destMailboxContract = destMailboxClient.getContract();
    
    // Add or update wrapper on destination chain
    await destMailboxContract.addOrUpdateWrapper(
      messageDetails.nexusAppIDFrom,
      {
        verifier: (await zksyncVerifier.getConfig()).verifierAddress,
        mailboxAddress: (await agent.getMailboxClient(true)).getAddress()
      }
    );
    console.log(`[NexusBridge] Added or updated wrapper on destination chain`);
    
    // Prepare message for receiving
    const messageDecoded = {
      nexusAppIDFrom: messageDetails.nexusAppIDFrom,
      nexusAppIDTo: [...messageDetails.nexusAppIDTo],
      data: messageDetails.data,
      from: messageDetails.from,
      to: [...messageDetails.to],
      nonce: messageDetails.nonce
    };
    
    // Receive message on destination chain
    console.log(`[NexusBridge] Receiving message on destination chain...`);
    const receiveTx = await destMailboxContract.receiveMessage(
      accountDetails.response.account.height,
      messageDecoded,
      proofEncoded
    );
    
    const receipt = await receiveTx.wait();
    console.log(`[NexusBridge] Message received on destination chain: ${receiveTx.hash}`);
    
    // Check for Transfer events in the receipt
    const transferEvents: Array<{from: string; to: string; amount: string}> = [];
    for (const log of receipt.logs) {
      try {
        // Check if this is a Transfer event (ERC20 standard event signature)
        if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          transferEvents.push({
            from: '0x' + log.topics[1].substring(26),
            to: '0x' + log.topics[2].substring(26),
            amount: log.data
          });
        }
      } catch (error) {
        // Not a Transfer event, continue
        continue;
      }
    }
    
    return {
      success: true,
      transactionHash: receiveTx.hash,
      messageId,
      transferEvents,
      status: "Token successfully received on destination chain"
    };
  } catch (error: any) {
    console.error(`[NexusBridge] Error in receiveTokenAction: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to wait for a block to be processed by Nexus
 * @param nexusClient The Nexus client
 * @param blockHeight The block height to wait for
 * @returns The account details from Nexus
 */
async function waitForUpdateOnNexus(nexusClient: any, blockHeight: number): Promise<any> {
  const maxRetries = 30;
  const retryDelay = 5000; // 5 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const accountDetails = await nexusClient.getAccount();
      
      // Check if the account has been updated with the block we're waiting for
      if (accountDetails.response.account.height >= blockHeight) {
        return accountDetails;
      }
      
      console.log(`[NexusBridge] Waiting for block ${blockHeight}, current height: ${accountDetails.response.account.height}`);
    } catch (error) {
      console.error(`[NexusBridge] Error checking Nexus account: ${error}`);
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error(`Timeout waiting for block ${blockHeight} to be processed by Nexus`);
} 