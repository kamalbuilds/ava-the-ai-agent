import { NexusBridgeAgent } from "..";

export interface VerifyBridgeParams {
  messageId: string;
  transactionHash?: string;
}

/**
 * Action to verify the status of a bridge transaction
 * @param agent The Nexus Bridge Agent instance
 * @param params Parameters for the verify bridge operation
 * @returns Result of the operation
 */
export async function verifyBridgeAction(
  agent: NexusBridgeAgent,
  params: VerifyBridgeParams
): Promise<any> {
  try {
    const { messageId, transactionHash } = params;
    
    // Get source chain bridge contract
    const sourceBridgeContract = await agent.getSourceBridgeContract();
    
    // Check if the message exists in the source chain
    const messageHash = await sourceBridgeContract.isSent(messageId);
    if (!messageHash || messageHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return {
        success: false,
        status: "Message not found on source chain",
        messageId
      };
    }
    
    console.log(`[NexusBridge] Found message hash: ${messageHash}`);
    
    // Get destination chain bridge contract
    const destBridgeContract = await agent.getDestBridgeContract();
    
    // Check if the message has been bridged on the destination chain
    const isBridged = await destBridgeContract.isBridged(messageHash);
    
    if (isBridged) {
      return {
        success: true,
        status: "Message has been successfully bridged",
        messageId,
        messageHash,
        sourceChain: "Verified on source chain",
        destinationChain: "Verified on destination chain"
      };
    }
    
    // If we have a transaction hash, check its status
    if (transactionHash) {
      try {
        // Check on source chain
        const signer = await agent.getSourceChainSigner();
        const sourceProvider = signer.provider;
        const sourceTxReceipt = await sourceProvider.getTransactionReceipt(transactionHash);
        
        if (sourceTxReceipt) {
          return {
            success: true,
            status: "Transaction confirmed on source chain, waiting for processing on destination chain",
            messageId,
            messageHash,
            sourceChain: "Transaction confirmed",
            destinationChain: "Pending",
            blockNumber: sourceTxReceipt.blockNumber,
            confirmations: await sourceProvider.getBlockNumber() - sourceTxReceipt.blockNumber
          };
        }
        
        // Check on destination chain
        const destSigner = await agent.getDestChainSigner();
        const destProvider = destSigner.provider;
        const destTxReceipt = await destProvider.getTransactionReceipt(transactionHash);
        
        if (destTxReceipt) {
          return {
            success: true,
            status: "Transaction confirmed on destination chain",
            messageId,
            messageHash,
            sourceChain: "Verified",
            destinationChain: "Transaction confirmed",
            blockNumber: destTxReceipt.blockNumber,
            confirmations: await destProvider.getBlockNumber() - destTxReceipt.blockNumber
          };
        }
        
        return {
          success: false,
          status: "Transaction not found on either chain",
          messageId,
          messageHash,
          sourceChain: "Transaction not found",
          destinationChain: "Transaction not found"
        };
      } catch (error: any) {
        console.error(`[NexusBridge] Error checking transaction status: ${error.message}`);
        return {
          success: false,
          status: `Error checking transaction status: ${error.message}`,
          messageId,
          messageHash
        };
      }
    }
    
    // If we don't have a transaction hash, just return the message status
    return {
      success: true,
      status: "Message exists on source chain but has not been bridged to destination chain yet",
      messageId,
      messageHash,
      sourceChain: "Verified on source chain",
      destinationChain: "Pending"
    };
  } catch (error: any) {
    console.error(`[NexusBridge] Error in verifyBridgeAction: ${error.message}`);
    return {
      success: false,
      status: `Error verifying bridge: ${error.message}`,
      messageId: params.messageId
    };
  }
} 