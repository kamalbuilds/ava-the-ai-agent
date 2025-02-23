import type {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  TxHash,
} from "@wormhole-foundation/sdk";
import {
  DEFAULT_TASK_TIMEOUT,
  TokenTransfer,
  TransferState,
  Wormhole,
  amount,
  api,
  tasks,
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/platforms/evm";
import solana from "@wormhole-foundation/sdk/platforms/solana";
import cosmwasm from "@wormhole-foundation/sdk/platforms/cosmwasm";
import algorand from "@wormhole-foundation/sdk/platforms/algorand";
import sui from "@wormhole-foundation/sdk/platforms/sui";

export interface SignerStuff<N extends Network, C extends Chain = Chain> {
  chain: ChainContext<N, C>;
  signer: Signer<N, C>;
  address: ChainAddress<C>;
}

export async function getSigner<N extends Network, C extends Chain>(
  chain: ChainContext<N, C>
): Promise<SignerStuff<N, C>> {
  // Read in from `.env`
  (await import("dotenv")).config();

  let signer: Signer;
  const platform = chain.platform.utils()._platform;
  switch (platform) {
    case "Solana":
      signer = await solana.getSigner(
        await chain.getRpc(),
        getEnv("SOL_PRIVATE_KEY"),
        {
          debug: true,
          priorityFee: {
            percentile: 0.5,
            percentileMultiple: 2,
            min: 1,
            max: 1000,
          },
        }
      );

      break;
    case "Cosmwasm":
      signer = await cosmwasm.getSigner(
        await chain.getRpc(),
        getEnv("COSMOS_MNEMONIC")
      );
      break;
    case "Evm":
      signer = await evm.getSigner(
        await chain.getRpc(),
        getEnv("ETH_PRIVATE_KEY"),
        {
          debug: true,
          maxGasLimit: amount.units(amount.parse("0.01", 18)),
        }
      );
      break;
    case "Algorand":
      signer = await algorand.getSigner(
        await chain.getRpc(),
        getEnv("ALGORAND_MNEMONIC")
      );
      break;
    case "Sui":
      signer = await sui.getSigner(
        await chain.getRpc(),
        getEnv("SUI_PRIVATE_KEY")
      );
      break;
    default:
      throw new Error("Unrecognized platform: " + platform);
  }

  return {
    chain,
    signer: signer as Signer<N, C>,
    address: Wormhole.chainAddress(chain.chain, signer.address()),
  };
}

function getEnv(key: string): string {
  // If we're in the browser, return empty string
  if (typeof process === undefined) return "";

  // Otherwise, return the env var or error
  const val = process.env[key];
  if (!val)
    throw new Error(
      `Missing env var ${key}, did you forget to set values in '.env'?`
    );

  return val;
}
