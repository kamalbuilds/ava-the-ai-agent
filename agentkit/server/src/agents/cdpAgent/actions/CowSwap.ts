import { z } from "zod";
import {
    ActionProvider,
    WalletProvider,
    Network,
    CreateAction,
} from "@coinbase/agentkit";
import {
    OrderBookApi,
    OrderQuoteSideKindSell,
    OrderSigningUtils,
    SupportedChainId,
    UnsignedOrder,
} from "@cowprotocol/cow-sdk";
import { TOKEN_DETAILS } from "../helpers/utils";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export const SwapSchema = z.object({
    sellToken: z.string().describe("Sell Token is required"),
    buyToken: z.string().describe("Buy Token is required"),
    amount: z.number().describe("Amount is required"),
});

// Define an action provider that uses a wallet provider.
export class CowSwapActionProvider extends ActionProvider<WalletProvider> {
    constructor() {
        super("cow-swap-action", []);
    }

    // Define if the action provider supports the given network
    supportsNetwork = (network: Network) => true;

    @CreateAction({
        name: "swap",
        description: `Helps in swapping by selling the sell Token and buying the buy Token. 
      - You show the Quote Request to the user and ask for confirmation of the quote. Display Quote in a proper JSON format.
      `,
        schema: SwapSchema,
    })
    async swapActivity(
        walletProvider: WalletProvider,
        params: z.infer<typeof SwapSchema>
    ): Promise<string> {
        //TODO: Fetch the token contract address by the token name


        try {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string)

            const sellTokenAddress =
                TOKEN_DETAILS[params.sellToken as keyof typeof TOKEN_DETAILS];
            const buyTokenAddress =
                TOKEN_DETAILS[params.buyToken as keyof typeof TOKEN_DETAILS];

            const amount = ethers.utils.parseUnits(
                params.amount.toString(),
                sellTokenAddress.decimals
            );

            console.log("amount", amount);

            const quoteRequest = {
                sellToken: sellTokenAddress.address,
                buyToken: buyTokenAddress.address,
                from: walletProvider.getAddress(),
                sellAmountBeforeFee: amount.toString(),
                kind: OrderQuoteSideKindSell.SELL,
            };

            console.log("Quote request >>>", quoteRequest);

            const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.BASE })

            const { quote } = await orderBookApi.getQuote(quoteRequest)

            console.log("quote", quote);

            const unsignedQuote: UnsignedOrder = {
                ...quote,
                receiver: walletProvider.getAddress(),
            }

            const network = walletProvider.getNetwork();

            const orderSigningResult = await OrderSigningUtils.signOrder(unsignedQuote, Number(network.chainId), wallet)

            console.log("orderSigningResult >>", orderSigningResult);

            //@ts-expect-error
            const orderId = await orderBookApi.sendOrder({ ...quote, ...orderSigningResult })

            const order = await orderBookApi.getOrder(orderId)

            const trades = await orderBookApi.getTrades({ orderUid: orderId })

            console.log('Results: ', { orderId, order, trades })

            return `Order Created successfully, Here are the order details: 
         {
            orderId:${orderId},
         }
         
         `
        } catch (error) {
            console.log("Error in creating order", error);
            return `Error executing order ${(error as any).message}`
        }
    }
}

export const cowSwapActionProvider = () => new CowSwapActionProvider();
