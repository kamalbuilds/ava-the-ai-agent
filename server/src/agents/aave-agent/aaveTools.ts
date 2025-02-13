import { Account } from "viem";
import {
  Tool,
  ToolExecutionOptions,
  ToolResult,
} from "../../services/ai/types";
import { z } from "zod";
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { formatReserves, formatReservesAndIncentives } from "@aave/math-utils";

const chainIdToRPCProvider: Record<number, string> = {
  1: "https://eth-mainnet.alchemyapi.io/v2/demo",
  137: "https://polygon-rpc.com",
  43114: "https://api.avax.network/ext/bc/C/rpc",
  42161: "https://arb1.arbitrum.io/rpc",
  250: "https://rpc.ftm.tools",
  10: "https://optimism-mainnet.public.blastapi.io",
  1666600000: "https://api.harmony.one",
  1088: "https://andromeda.metis.io/?owner=1088",
  8453: "https://base-mainnet.public.blastapi.io",
  100: "https://gnosis-mainnet.public.blastapi.io",
  56: "https://bsc-mainnet.public.blastapi.io",
  534352: "https://scroll-mainnet.public.blastapi.io",
};

export const getAaveTools = (account: Account): Record<string, Tool> => {
  return {
    getMarketReserves: {
      description: `A tool that returns an array of pool reserves and market base currency data.
        It accepts:
        - chainId: Chain Id of the Chain
        

        It returns:
        - reserves: returns an array of formatted configuration and live usage data for each reserve in an Aave market,
        - reservesAndIncentives: returns an array of formatted configuration and live usage data plus an object with supply, variable borrow, and stable borrow incentives for each reserve in an Aave market
        `,
      parameters: z.object({
        chainId: z.number().describe("Chain Id of the Chain"),
      }),
      execute: async (
        args: Record<string, any>,
        options?: ToolExecutionOptions
      ): Promise<ToolResult> => {
        try {
          console.log("======== Fetching Market Reserves from Aave =========");
          console.log(` Fetching reserves for chainId: ${args.chainId}`);

          const provider = new ethers.providers.StaticJsonRpcProvider(
            chainIdToRPCProvider[args.chainId],
            args.chainId
          );
          const poolDataProviderContract = new UiPoolDataProvider({
            uiPoolDataProviderAddress:
              markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
            provider,
            chainId: args.chainId,
          });

          console.log("poolDataProviderContract >>", poolDataProviderContract);

          const incentiveDataProviderContract = new UiIncentiveDataProvider({
            uiIncentiveDataProviderAddress:
              markets.AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
            provider,
            chainId: args.chainId,
          });

          console.log(
            "incentiveDataProviderContract >>",
            incentiveDataProviderContract
          );

          const reserves = await poolDataProviderContract.getReservesHumanized({
            lendingPoolAddressProvider:
              markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
          });

          const reserveIncentives =
            await incentiveDataProviderContract.getReservesIncentivesDataHumanized(
              {
                lendingPoolAddressProvider:
                  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
              }
            );

          console.log(" Fetching reserves  successfully done >>>>", reserves);
          console.log(
            " Fetching reserveIncentives  successfully done >>>>",
            reserveIncentives
          );

          const reservesArray = reserves.reservesData;
          const baseCurrencyData = reserves.baseCurrencyData;

          const currentTimestamp = dayjs().unix();

          const formattedPoolReserves = formatReserves({
            reserves: reservesArray,
            currentTimestamp,
            marketReferenceCurrencyDecimals:
              baseCurrencyData.marketReferenceCurrencyDecimals,
            marketReferencePriceInUsd:
              baseCurrencyData.marketReferenceCurrencyPriceInUsd,
          });

          const formattedPoolReservesAndIncentives =
            formatReservesAndIncentives({
              reserves: reservesArray,
              currentTimestamp,
              marketReferenceCurrencyDecimals:
                baseCurrencyData.marketReferenceCurrencyDecimals,
              marketReferencePriceInUsd:
                baseCurrencyData.marketReferenceCurrencyPriceInUsd,
              reserveIncentives,
            });

          return {
            success: true,
            result: `Successfully fetched reserves from Aave Protocol (its an array of objects):
            formattedPoolReserves :${JSON.stringify(formattedPoolReserves)}
            formattedPoolReservesAndIncentives :${JSON.stringify(
              formattedPoolReservesAndIncentives
            )}
            `,
          };
        } catch (error) {
          console.log("Error in getting market reserves", error);
          return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },
  };
};
