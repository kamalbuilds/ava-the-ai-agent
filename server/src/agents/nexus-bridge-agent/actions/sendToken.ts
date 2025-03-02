import { ethers } from "ethers";
import { NexusBridgeAgent } from "..";
import { bridgeTokens, DEFAULT_NONCE } from "../constants";

export interface SendTokenParams {
  tokenId: string;
  amount: string;
  recipient: string;
}

/**
 * Action to send tokens from source chain to destination chain via Nexus Bridge
 * @param agent The Nexus Bridge Agent instance
 * @param params Parameters for the send token operation
 * @returns Result of the operation
 */
export async function sendTokenAction(
  agent: NexusBridgeAgent,
  params: SendTokenParams
): Promise<any> {
  try {
    const { tokenId, amount, recipient } = params;
    
    // Get token configuration
    const tokenConfig = bridgeTokens[tokenId as keyof typeof bridgeTokens];
    if (!tokenConfig) {
      throw new Error(`Token with ID ${tokenId} is not supported`);
    }
    
    // Get source chain signer and bridge contract
    const signer = await agent.getSourceChainSigner();
    const bridgeContract = await agent.getSourceBridgeContract();
    
    // Get destination app ID
    const destAppId = (await agent.getZKSyncVerifier()).getDestinationAppId();
    
    // Get destination bridge contract address
    const destBridgeContract = await agent.getDestBridgeContract();
    const destBridgeAddress = await destBridgeContract.getAddress();
    
    // Create ERC20 contract instance
    const erc20Contract = new ethers.Contract(
      tokenConfig.sourceChainAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
      ],
      signer
    );
    
    // Check balance
    const balance = await erc20Contract.balanceOf(signer.address);
    const amountWei = ethers.utils.parseUnits(amount, tokenConfig.decimals);
    
    if (balance.lt(amountWei)) {
      throw new Error(`Insufficient balance. Required: ${amount} ${tokenConfig.symbol}, Available: ${ethers.utils.formatUnits(balance, tokenConfig.decimals)} ${tokenConfig.symbol}`);
    }
    
    // Approve bridge contract to spend tokens
    console.log(`[NexusBridge] Approving ${amount} ${tokenConfig.symbol} for bridge contract`);
    const approveTx = await erc20Contract.approve(await bridgeContract.getAddress(), amountWei);
    await approveTx.wait();
    console.log(`[NexusBridge] Approval transaction confirmed: ${approveTx.hash}`);
    
    // Prepare asset ID (padded to 32 bytes)
    const assetId = ethers.utils.hexZeroPad(ethers.utils.hexlify(tokenId), 32);
    
    // Prepare recipient address (padded to 32 bytes)
    const recipientAddress = ethers.utils.hexZeroPad(ethers.utils.hexlify(recipient), 32);
    
    // Send tokens to bridge
    console.log(`[NexusBridge] Sending ${amount} ${tokenConfig.symbol} to bridge`);
    const sendTx = await bridgeContract.sendERC20(
      assetId,
      recipientAddress,
      amountWei,
      [destAppId],
      DEFAULT_NONCE,
      [destBridgeAddress]
    );
    
    const receipt = await sendTx.wait();
    console.log(`[NexusBridge] Send transaction confirmed: ${sendTx.hash}`);
    
    // Extract message ID from logs
    let messageId = null;
    for (const log of receipt.logs) {
      try {
        // Try to decode MessageSent event
        const eventInterface = new ethers.utils.Interface([
          "event MessageSent(address indexed sender, bytes32 indexed recipient, uint256 indexed id)"
        ]);
        const decodedLog = eventInterface.parseLog(log);
        if (decodedLog && decodedLog.name === "MessageSent") {
          messageId = decodedLog.args.id.toString();
          break;
        }
      } catch (error) {
        // Not the event we're looking for, continue
        continue;
      }
    }
    
    return {
      success: true,
      transactionHash: sendTx.hash,
      messageId,
      tokenSymbol: tokenConfig.symbol,
      amount,
      recipient,
      blockNumber: receipt.blockNumber,
      status: "Token sent to bridge. Waiting for confirmation on destination chain."
    };
  } catch (error: any) {
    console.error(`[NexusBridge] Error in sendTokenAction: ${error.message}`);
    throw error;
  }
} 