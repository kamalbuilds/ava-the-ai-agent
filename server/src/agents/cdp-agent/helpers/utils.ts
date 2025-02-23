import { Wormhole, chainToPlatform, isTokenId } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/platforms/evm";
import solana from "@wormhole-foundation/sdk/platforms/solana";

export async function getSigner(chain) {
  // Read in from `.env`
  (await import("dotenv")).config();

  let signer;
  const platform = chainToPlatform(chain.chain);
  console.log("platform", platform);
  switch (platform) {
    case "Solana":
      signer = await solana.getSigner(
        await chain.getRpc(),
        getEnv("OTHER_SOL_PRIVATE_KEY"),
        { debug: false }
      );
      break;
    case "Evm":
      signer = await evm.getSigner(
        await chain.getRpc(),
        getEnv("ETH_PRIVATE_KEY")
      );
      break;
    default:
      throw new Error("Unrecognized platform: " + platform);
  }

  return {
    chain,
    signer: signer,
    address: Wormhole.chainAddress(chain.chain, signer.address()),
  };
}

function getEnv(key: string): string {
  // If we're in the browser, return empty string
  if (typeof process === undefined) return "";
  // Otherwise, return the env var or error
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `Missing env var ${key}, did you forget to set values in '.env'?`
    );
  }
  return val;
}

export async function getTokenDecimals(wh, token, sendChain) {
  return isTokenId(token)
    ? Number(await wh.getDecimals(token.chain, token.address))
    : sendChain.config.nativeTokenDecimals;
}
