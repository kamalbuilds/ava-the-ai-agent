import { NextResponse } from "next/server";
import { DEPLOYMENT_URL } from "vercel-url";

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Ref Finance API",
      description:
        "API for retrieving token metadata and swapping tokens through Ref Finance.",
      version: "1.0.0",
    },
    servers: [
      {
        // Set by vercel-url if using Vercel system env vars.  Override for non-Vercel deployments or during local dev tunneling
        // See: https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables
        url: DEPLOYMENT_URL,
      },
    ],
    "x-mb": {
      "account-id": process.env.ACCOUNT_ID,
      assistant: {
        name: "Ref Finance Agent",
        description:
          "An assistant that provides token metadata and swaps tokens through Ref Finance.",
        instructions:
          "Get information for a given fungible token or swaps one token for another. Do not modify token identifiers, they will be fuzzy matched automatically.",
        tools: [{ type: "generate-transaction" }],
      },
    },
    paths: {
      "/api/{token}": {
        get: {
          operationId: "get-token-metadata",
          description:
            "Get token metadata from Ref Finance. Token identifiers can be the name, symbol, or contractId and will be fuzzy matched automatically.",
          parameters: [
            {
              name: "token",
              in: "path",
              description: "The identifier for the token to get metadata for.",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      symbol: {
                        type: "string",
                      },
                      decimals: {
                        type: "number",
                      },
                      icon: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad request",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/swap/{tokenIn}/{tokenOut}/{quantity}": {
        get: {
          operationId: "get-swap-transactions",
          description:
            "Get a transaction payload for swapping between two tokens using the best trading route on Ref.Finance. Token identifiers can be the name, symbol, or contractId and will be fuzzy matched automatically. Default slippage is 2 (2%).",
          parameters: [
            {
              name: "tokenIn",
              in: "path",
              description: "The identifier for the input token.",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "tokenOut",
              in: "path",
              description: "The identifier for the output token.",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "quantity",
              in: "path",
              description: "The amount of tokens to swap (input amount).",
              required: true,
              schema: {
                type: "string",
              },
            },
            {
              name: "slippage",
              in: "query",
              description:
                "The maximum slippage tolerance in percentage.  Default is 2 (2%).",
              required: false,
              schema: {
                type: "number",
                format: "float",
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signerId: {
                          type: "string",
                          description:
                            "The account ID that will sign the transaction",
                        },
                        receiverId: {
                          type: "string",
                          description:
                            "The account ID of the contract that will receive the transaction",
                        },
                        actions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                                description: "The type of action to perform",
                              },
                              params: {
                                type: "object",
                                properties: {
                                  methodName: {
                                    type: "string",
                                    description:
                                      "The name of the method to be called",
                                  },
                                  args: {
                                    type: "object",
                                    description:
                                      "Arguments for the function call",
                                  },
                                  gas: {
                                    type: "string",
                                    description:
                                      "Amount of gas to attach to the transaction",
                                  },
                                  deposit: {
                                    type: "string",
                                    description:
                                      "Amount to deposit with the transaction",
                                  },
                                },
                                required: [
                                  "methodName",
                                  "args",
                                  "gas",
                                  "deposit",
                                ],
                              },
                            },
                            required: ["type", "params"],
                          },
                        },
                      },
                      required: ["signerId", "receiverId", "actions"],
                    },
                  },
                },
              },
            },
            "400": {
              description: "Bad request",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "The error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return NextResponse.json(pluginData);
}
