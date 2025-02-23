import {
  ActionProvider,
  WalletProvider,
  Network,
  CreateAction,
  ViemWalletProvider,
} from "@coinbase/agentkit";
import { z } from "zod";
import {
  ChainAddress,
  Wormhole,
  amount,
  signSendWait,
  toNative,
} from "@wormhole-foundation/sdk";
import { isTokenId, TokenTransfer, wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";
import sui from "@wormhole-foundation/sdk/sui";
import { getSigner } from "../helpers/utils";

export const MyActionSchema = z.object({
  sourceChain: z.enum(["Ethereum", "Solana", "Base"]),
  destinationChain: z.enum(["Ethereum", "Solana", "Base"]),
  amount: z.string(),
  receiverAddress: z.string(),
});

// Define an action provider that uses a wallet provider.
class WormholeActionProvider extends ActionProvider<ViemWalletProvider> {
  constructor() {
    super("wormhole-action-provider", []);
  }

  @CreateAction({
    name: "transferNativeToken-action",
    description:
      "Transfer Native Token from source chain to destination Chain. Remember this only supports native token of the chain",
    schema: MyActionSchema,
  })
  async transferNativeTokenAction(
    walletProvider: ViemWalletProvider,
    args: z.infer<typeof MyActionSchema>
  ) {
    const wh = await wormhole("Testnet", [evm, solana, sui]);

    const sourceChain = wh.getChain(args.sourceChain);
    const destinationChain = wh.getChain(args.destinationChain);

    const sender = await getSigner(sourceChain);

    const token = await sourceChain.getNativeWrappedTokenId();

    const tbDest = await destinationChain.getTokenBridge();
    try {
      const wrapped = await tbDest.getWrappedAsset(token);
      console.log(
        `Token already wrapped on ${destinationChain.chain}. Skipping attestation.`
      );
    } catch (e) {
      console.log(
        `No wrapped token found on ${destinationChain.chain}. Please try again with other chain.`
      );
    }

    const sndTb = await sourceChain.getTokenBridge();
    const tokenId = Wormhole.tokenId(sourceChain.chain, "native");

    const amt = amount.units(
      amount.parse(args.amount, sourceChain.config.nativeTokenDecimals)
    );

    const walletAddress = await walletProvider.getAddress();
    const senderAddress = toNative(sourceChain.chain, walletAddress);

    const receiverAddress: ChainAddress = Wormhole.chainAddress(
      destinationChain.chain,
      args.receiverAddress
    );
    const transfer = sndTb.transfer(
      senderAddress,
      receiverAddress,
      tokenId.address,
      amt
    );

    const txids = await signSendWait(sourceChain, transfer, sender.signer);
    console.log("Sent: ", txids);

    const latestTxID = txids[txids.length - 1].txid;
    const wormhole_scan = `https://wormholescan.io/#/tx/${latestTxID}?network=Testnet`;
    return `
    Transaction ID Successfully created from ${args.sourceChain} to ${args.destinationChain}: 
    {
        "transaction_id":${latestTxID},
        "wormhole_scan":${wormhole_scan}
    } 
    `;
  }

  // Define if the action provider supports the given network
  supportsNetwork = (network: Network) => true;
}

export const wormholeActionProvider = () => new WormholeActionProvider();
