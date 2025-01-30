import { z } from "zod";
import { Wallet, hashMessage } from "@coinbase/coinbase-sdk";

// Define the prompt for the sign message action
export const SIGN_MESSAGE_PROMPT = `
This tool will sign arbitrary messages using EIP-191 Signed Message Standard hashing.
`;

// Define the input schema using Zod
export const SignMessageInput = z
  .object({
    message: z.string().describe("The message to sign. e.g. `hello world`"),
  })
  .strip()
  .describe("Instructions for signing a blockchain message");

/**
 * Signs a message using EIP-191 message hash from the wallet
 *
 * @param wallet - The wallet to sign the message from
 * @param args - The input arguments for the action
 * @returns The message and corresponding signature
 */
export async function signMessage(
  wallet: Wallet,
  args: z.infer<typeof SignMessageInput>
): Promise<string> {
  // Using the correct method from Wallet interface
  const payloadSignature = await wallet.createPayloadSignature(
    hashMessage(args.message)
  );
  return `The payload signature ${payloadSignature}`;
}
