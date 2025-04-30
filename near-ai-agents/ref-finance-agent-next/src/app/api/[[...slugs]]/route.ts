import { swagger } from "@elysiajs/swagger";
import {
  WRAP_NEAR_CONTRACT_ID,
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  getStablePools,
  instantSwap,
  nearDepositTransaction,
  nearWithdrawTransaction,
  transformTransactions,
  type EstimateSwapView,
  type Pool,
  type TransformedTransaction,
} from "@ref-finance/ref-sdk";
import { Elysia } from "elysia";

import { searchToken } from "@/utils/search-token";
import { getSlippageTolerance } from "@/utils/slippage";
import { NextRequest, NextResponse } from 'next/server';
import { allowListedTokens } from '../../../utils/allowlist-tokens';

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const REFERRAL_ID = "bitte.near";

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger())
  .get("/:token", async ({ params: { token } }) => {
    const tokenMatch = searchToken(token)[0];
    if (!tokenMatch) {
      return {
        error: `Token ${token} not found`,
      };
    }
    const tokenMetadata = await ftGetTokenMetadata(tokenMatch.id);
    if (!tokenMetadata) {
      return {
        error: `Metadata for token ${token} not found`,
      };
    }

    return {
      ...tokenMetadata,
      icon: "",
    };
  })
  .get(
    "/swap/:tokenIn/:tokenOut/:quantity",
    async ({
      params: { tokenIn, tokenOut, quantity },
      query: { slippage },
      headers,
    }): Promise<TransformedTransaction[] | { error: string }> => {
      const mbMetadata: { accountId: string } | undefined =
        headers["mb-metadata"] && JSON.parse(headers["mb-metadata"]);
      const accountId = mbMetadata?.accountId || "near";

      const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();

      const stablePools: Pool[] = unRatedPools.concat(ratedPools);

      // remove low liquidity DEGEN_SWAP pools
      const nonDegenStablePools = stablePools.filter(
        (pool) => pool.pool_kind !== "DEGEN_SWAP"
      );

      const nonDegenStablePoolsDetails = await getStablePools(
        nonDegenStablePools
      );

      const isNearIn = tokenIn.toLowerCase() === "near";
      const isNearOut = tokenOut.toLowerCase() === "near";

      const tokenInMatch = searchToken(tokenIn)[0];
      const tokenOutMatch = searchToken(tokenOut)[0];

      if (!tokenInMatch || !tokenOutMatch) {
        return {
          error: `Unable to find token(s) tokenInMatch: ${tokenInMatch?.name} tokenOutMatch: ${tokenOutMatch?.name}`,
        };
      }

      const [tokenInData, tokenOutData] = await Promise.all([
        ftGetTokenMetadata(tokenInMatch.id),
        ftGetTokenMetadata(tokenOutMatch.id),
      ]);

      if (tokenInData.id === WRAP_NEAR_CONTRACT_ID && isNearOut) {
        return transformTransactions(
          [nearWithdrawTransaction(quantity)],
          accountId
        );
      }

      if (isNearIn && tokenOutData.id === WRAP_NEAR_CONTRACT_ID) {
        return transformTransactions(
          [nearDepositTransaction(quantity)],
          accountId
        );
      }

      if (tokenInData.id === tokenOutData.id && isNearIn === isNearOut) {
        return { error: "TokenIn and TokenOut cannot be the same" };
      }

      const refEstimateSwap = (enableSmartRouting: boolean) => {
        return estimateSwap({
          tokenIn: tokenInData,
          tokenOut: tokenOutData,
          amountIn: quantity,
          simplePools,
          options: {
            enableSmartRouting,
            stablePools: nonDegenStablePools,
            stablePoolsDetail: nonDegenStablePoolsDetails,
          },
        });
      };

      const swapTodos: EstimateSwapView[] = await refEstimateSwap(true).catch(
        () => {
          return refEstimateSwap(false); // fallback to non-smart routing if unsupported
        }
      );

      const slippageTolerance = getSlippageTolerance(slippage);

      const refSwapTransactions = await instantSwap({
        tokenIn: tokenInData,
        tokenOut: tokenOutData,
        amountIn: quantity,
        swapTodos,
        slippageTolerance,
        AccountId: accountId,
        referralId: REFERRAL_ID,
      });

      if (isNearIn) {
        // wrap near
        refSwapTransactions.unshift(nearDepositTransaction(quantity));
      }

      if (isNearOut) {
        const lastFunctionCall = refSwapTransactions
          .at(-1)
          ?.functionCalls.at(-1);

        const args = lastFunctionCall?.args;

        if (args && "msg" in args && typeof args.msg === "string") {
          const argsMsgObj = JSON.parse(args.msg);

          argsMsgObj.skip_unwrap_near = false;

          lastFunctionCall.args = {
            ...lastFunctionCall.args,
            msg: JSON.stringify(argsMsgObj),
          };
        }
      }
      return transformTransactions(refSwapTransactions, accountId);
    }
  )
  .compile();

export const GET = app.handle;
export const POST = app.handle;

/**
 * Dynamic API route handler that supports various REF Finance endpoints
 * @param req The request object
 * @param params Path parameters from the URL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slugs: string[] } }
) {
  const { slugs } = params;
  const url = new URL(req.url);

  try {
    // Handle different API patterns based on the slugs
    if (!slugs || slugs.length === 0) {
      // Root API endpoint - return available endpoints
      return NextResponse.json({
        endpoints: [
          '/api/tokens',
          '/api/tokens/{tokenId}',
          '/api/pools',
          '/api/price',
          '/api/swap'
        ]
      });
    }

    // Token listing or search
    if (slugs[0] === 'tokens') {
      if (slugs.length === 1) {
        // Get all tokens or search
        const searchTerm = url.searchParams.get('search') || '';
        const limit = parseInt(url.searchParams.get('limit') || '20');
        
        if (searchTerm) {
          const matchedTokens = searchToken(searchTerm, allowListedTokens, limit);
          return NextResponse.json({ tokens: matchedTokens });
        } else {
          // Return first n tokens from the allowlist
          return NextResponse.json({ 
            tokens: allowListedTokens.slice(0, limit)
          });
        }
      } else if (slugs.length === 2) {
        // Get specific token by ID or symbol
        const tokenId = slugs[1];
        const token = searchToken(tokenId, allowListedTokens, 1)[0];
        
        if (token) {
          return NextResponse.json(token);
        } else {
          return NextResponse.json(
            { error: `Token "${tokenId}" not found` },
            { status: 404 }
          );
        }
      }
    }

    // Pool information
    if (slugs[0] === 'pools') {
      // This would typically call a service to get pool data
      // For now, return a placeholder
      return NextResponse.json({
        pools: [
          {
            id: 1,
            tokens: [allowListedTokens[0], allowListedTokens[1]],
            fee: 0.3,
            tvl: "1000000",
            volume24h: "250000"
          },
          {
            id: 2,
            tokens: [allowListedTokens[0], allowListedTokens[2]],
            fee: 0.5,
            tvl: "500000",
            volume24h: "120000"
          }
        ]
      });
    }

    // Price information
    if (slugs[0] === 'price') {
      const tokenIn = url.searchParams.get('tokenIn');
      const tokenOut = url.searchParams.get('tokenOut') || 'wrap.near';
      
      if (!tokenIn) {
        return NextResponse.json(
          { error: "Missing required 'tokenIn' parameter" },
          { status: 400 }
        );
      }
      
      // This would typically call a service to get price data
      // For now, return a placeholder
      const tokenInData = searchToken(tokenIn, allowListedTokens, 1)[0];
      const tokenOutData = searchToken(tokenOut, allowListedTokens, 1)[0];
      
      if (!tokenInData || !tokenOutData) {
        return NextResponse.json(
          { error: "One or both tokens not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        price: "1.25",
        tokenIn: tokenInData,
        tokenOut: tokenOutData
      });
    }

    // Fallback for unknown endpoints
    return NextResponse.json(
      { error: `Unknown API endpoint: /api/${slugs.join('/')}` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slugs: string[] } }
) {
  const { slugs } = params;

  try {
    // Handle swap endpoint
    if (slugs && slugs[0] === 'swap') {
      const body = await req.json();
      const { accountId, tokenIn, tokenOut, amountIn, slippage = 0.5 } = body;
      
      // Validate required parameters
      if (!accountId || !tokenIn || !tokenOut || !amountIn) {
        return NextResponse.json(
          { error: "Missing required parameters" },
          { status: 400 }
        );
      }
      
      // This would typically call a service to create a swap transaction
      // For now, return a placeholder
      return NextResponse.json({
        transaction: {
          signerId: accountId,
          receiverId: "v2.ref-finance.near",
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "swap",
                args: {
                  token_in: tokenIn,
                  token_out: tokenOut,
                  amount_in: amountIn
                },
                gas: "100000000000000",
                deposit: "1"
              }
            }
          ]
        },
        expectedOutput: "1000000000000000000000000",
        priceImpact: 0.05
      });
    }

    // Fallback for unknown endpoints
    return NextResponse.json(
      { error: `Unknown API endpoint: /api/${slugs?.join('/') || ''}` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
