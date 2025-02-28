import { z } from "zod";
import {
    ActionProvider,
    WalletProvider,
    Network,
    CreateAction,
} from "@coinbase/agentkit";
import {
    amount,
    Chain,
    chains,
    signSendWait,
    Wormhole,
    wormhole,
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import { getSigner } from "../helpers/signer";

const SupportedChains = [
    'Base',
    'Arbitrum',
    'Ethereum',
    'Polygon',
    'Optimism'
] as const;

export const WormholeActionTransferSchema = z.object({
    sourceChain: z.enum(SupportedChains).describe("Source chain for the transfer (ethereum, base, arbitrum, optimism, or polygon)"),
    destinationChain: z.enum(SupportedChains).describe("Source chain for the transfer (ethereum, base, arbitrum, optimism, or polygon)"),
    amount_value: z.string().describe('Amount of native token that will be transferred from source chain to destination chain')
});

export const WormholeActionRedeemSchema = z.object({
    sourceChain: z.enum(SupportedChains).describe("Source chain for the transfer (ethereum, base, arbitrum, optimism, or polygon)"),
    destinationChain: z.enum(SupportedChains).describe("Source chain for the transfer (ethereum, base, arbitrum, optimism, or polygon)"),
    amount_value: z.string().describe('Amount of native token that will be transferred from source chain to destination chain'),
    transaction_id: z.string().describe('Transaction ID of the transaction by which the agent can redeem the token')
});
export class WormholeActionProvider extends ActionProvider<WalletProvider> {
    private wh!: Wormhole<"Testnet">;
    constructor() {
        super("wormhole-action", []);
        this.initializeWormhole();
    }

    private async initializeWormhole() {
        const wh = await wormhole("Testnet", [
            evm,
        ]);

        this.wh = wh;
    }

    @CreateAction({
        name: "transfer_native_tokens",
        description: `Transfer native tokens from Source Chain to Destination Chain
        - Make sure to check for the source chain, Source chain should be supported by the agentkit.
        
        `,
        schema: WormholeActionTransferSchema,
    })
    async transferNativeTokenActivity(
        params: z.infer<typeof WormholeActionTransferSchema>
    ): Promise<string> {
        const { sourceChain, destinationChain, amount_value } = params;

        try {
            const srcChain = this.wh.getChain(sourceChain);
            const dstChain = this.wh.getChain(destinationChain);

            const sender = await getSigner(srcChain);
            const receiver = await getSigner(dstChain);

            const token = await srcChain.getNativeWrappedTokenId();
            const destTokenBridge = await dstChain.getTokenBridge();

            try {
                const wrapped = await destTokenBridge.getWrappedAsset(token);
                console.log(
                    `Token already wrapped on ${dstChain.chain}. Skipping attestation.`,
                    wrapped
                );
            } catch (error) {
                console.log(
                    `No wrapped token found on ${dstChain.chain}. Please try again with other chain.`
                );

                throw new Error(`No wrapped token found on: ${dstChain.chain}.Please try again with other chain. `);
            }

            const sourceTokenBridge = await srcChain.getTokenBridge();
            const tokenId = Wormhole.tokenId(srcChain.chain, "native");

            const amt = amount.units(
                amount.parse(
                    amount_value,
                    srcChain.config.nativeTokenDecimals
                )
            );

            const transfer = sourceTokenBridge.transfer(
                sender.address.address,
                receiver.address,
                tokenId.address,
                amt
            );

            const txids = await signSendWait(srcChain, transfer, sender.signer);

            const latestTxId = txids[txids.length - 1].txid;
            const explorer = `https://wormholescan.io/#/tx/${latestTxId}`;


            return `Transaction was successful. It will take some time to claim your balance. Your transaction Id is ${latestTxId} and you can check here ${explorer}`

        } catch (error) {
            console.log("Error in transferring the native tokens", error);
            return `Error transferring tokens: ${(error as any).message}`

        }
    }


    @CreateAction({
        name: "redeem_native_tokens",
        description: `Redeem native token on the destination Chain by passing the transactionID.
        - Make sure to check for the source chain, Source chain should be supported by the agentkit.
        `,
        schema: WormholeActionRedeemSchema,
    })
    async redeemNativeTokenActivity(
        params: z.infer<typeof WormholeActionRedeemSchema>
    ): Promise<string> {
        const { sourceChain, destinationChain, amount_value, transaction_id } = params;

        try {
            const srcChain = this.wh.getChain(sourceChain);
            const dstChain = this.wh.getChain(destinationChain);

            const receiver = await getSigner(dstChain);

            const [whm] = await srcChain.parseTransaction(transaction_id);
            console.log('Wormhole Messages: ', whm);

            const vaa = await this.wh.getVaa(
                // Wormhole Message ID
                whm,
                // Protocol:Payload name to use for decoding the VAA payload
                'TokenBridge:Transfer',
                // Timeout in milliseconds, depending on the chain and network, the VAA may take some time to be available
                600_000
            );

            if (vaa == null) {
                console.error("Tranfer is still in progress, please claim later");
                const explorer = `https://wormholescan.io/#/tx/${transaction_id}`;

                return `Transaction has not reached destination, please wait for more minutes.You can check the status here:${explorer} `
            }

            const rcvTb = await dstChain.getTokenBridge();

            const redeem = rcvTb.redeem(receiver.address.address, vaa);
            console.log("redeeem >>>", redeem);

            const rcvTxids = await signSendWait(dstChain, redeem, receiver.signer);
            console.log('Sent: ', rcvTxids);

            // Now check if the transfer is completed according to
            // the destination token bridge
            const finished = await rcvTb.isTransferCompleted(vaa);
            console.log('Transfer completed: ', finished);

            const latestTxId = rcvTxids[rcvTxids.length - 1].txid;
            const explorer = `https://wormholescan.io/#/tx/${latestTxId}`;

            return `Transaction was successful. It will take some time to claim your balance. Your transaction Id is ${latestTxId} and you can check here ${explorer}`

        } catch (error) {
            console.log("Error in redeeming tokens", error);
            return `Error transferring tokens: ${(error as any).message}`
        }
    }

    supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}

export const wormholeActionProvider = () => new WormholeActionProvider();
