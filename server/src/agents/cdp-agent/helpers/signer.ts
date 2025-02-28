import {
    type Chain,
    type ChainAddress,
    type ChainContext,
    type Network,
    type Signer,
    type TxHash,
} from "@wormhole-foundation/sdk";
import {
    Wormhole,
    amount,
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/platforms/evm";
import env from "../../../env";

export interface SignerStuff<N extends Network, C extends Chain = Chain> {
    chain: ChainContext<N, C>;
    signer: Signer<N, C>;
    address: ChainAddress<C>;
}

export async function getSigner<N extends Network, C extends Chain>(chain: ChainContext<N, C>): Promise<SignerStuff<N, C>> {
    const signer: Signer = await evm.getSigner(await chain.getRpc(), env.PRIVATE_KEY!, {
        debug: true,
        maxGasLimit: amount.units(amount.parse("0.01", 18)),
    })

    return {
        chain,
        signer: signer as Signer<N, C>,
        address: Wormhole.chainAddress(chain.chain, signer.address()),
    };
}