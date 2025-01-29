//? Example of contract invokation using agentkit

import { z } from "zod";
import { Amount, Wallet } from "@coinbase/coinbase-sdk";
import { encodeFunctionData } from "viem";
import { PREDICTION_ABI, PREDICTION_CONTRACT_ADDRESS } from "../constant";

// Define the prompt for the sign message action
export const CREATE_PREDICTION_MESSAGE = `
This tool will create a prediction from the ${PREDICTION_CONTRACT_ADDRESS} contract.
Prediction market will require user to pass question, imageURI, bettingduration and resolution period.
You'll need to specify:
- Question
- Image URL: URL of the Image
- Betting Duration: Duration of the time when the betting will be live
- Resolution Period: Time after which the prediction will get resolved

`;

type BettingDuration = number | bigint;

// Define the input schema using Zod
export const CreatePredictionInput = z
  .object({
    question: z.string().describe("Prediction Question"),
    imageURI: z.string().describe("URI of the Image"),
    bettingDuration: z
      .custom<BettingDuration>()
      .describe("Betting duration of the prediction."),
    resolutionPeriod: z
      .custom<BettingDuration>()
      .describe("Resolution Period of the prediction."),
  })
  .strip()
  .describe("Instructions for creating a prediction");

/**
 * Prompt example:
 * Can you create a prediction for prediciton market.
 * I want to create prediciton for 'Will Bitcoin hit 150k in 2025?'
 * where the imageURI is 'https://www.bankrate.com/2021/09/21101614/What-are-altcoins.jpeg',
 * bettingduration is '86400' and resolutionPeriod is '259200'.
 */

/**
 * Signs a message using EIP-191 message hash from the wallet
 *
 * @param wallet - The wallet to sign the message from
 * @param args - The input arguments for the action
 * @returns The message and corresponding signature
 */
export async function createPrediction(
  wallet: Wallet,
  args: z.infer<typeof CreatePredictionInput>
): Promise<string> {
  console.log("Args", args);

  try {
    const addressData = encodeFunctionData({
      abi: PREDICTION_ABI,
      functionName: "createPrediction",
      args: [
        args.question,
        args.imageURI,
        args.bettingDuration,
        args.resolutionPeriod,
      ],
    });
    console.log("Address data >>>", addressData);

    const predictionArgs = {
      _question: args.question,
      _imageUri: args.imageURI,
      _bettingDuration: args.bettingDuration,
      _resolutionDuration: args.resolutionPeriod,
    };

    console.log("PRediciton args", predictionArgs);

    const invocation = await wallet.invokeContract({
      contractAddress: PREDICTION_CONTRACT_ADDRESS,
      method: "createPrediction",
      args: predictionArgs,
      abi: PREDICTION_ABI,
    });

    const result = await invocation.wait();
    console.log("result >>>", result);

    return `Successfully created the prediction: ${result
      .getTransaction()
      .getTransactionHash()}
    } `;
  } catch (error) {
    console.log("Error", error);
    return `Encountered error: ${error}`;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}
