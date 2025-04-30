import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "REF Finance Agent API",
      description: "API for interacting with REF Finance on the NEAR Protocol",
      version: "1.0.0",
      contact: {
        name: "Ava Finance",
        url: "https://ava.finance",
        email: "support@ava.finance"
      }
    },
    servers: [
      {
        url: baseUrl,
        description: "REF Finance Agent server"
      }
    ],
    paths: {
      "/api/tokens": {
        get: {
          operationId: "getTokens",
          summary: "Get list of tokens",
          description: "Retrieve a list of tokens available on REF Finance",
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Search term to filter tokens",
              required: false,
              schema: {
                type: "string"
              }
            },
            {
              name: "limit",
              in: "query",
              description: "Maximum number of tokens to return",
              required: false,
              schema: {
                type: "integer",
                default: 20
              }
            }
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tokens: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Token"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/tokens/{tokenId}": {
        get: {
          operationId: "getToken",
          summary: "Get token details",
          description: "Retrieve details for a specific token",
          parameters: [
            {
              name: "tokenId",
              in: "path",
              description: "Token ID or symbol",
              required: true,
              schema: {
                type: "string"
              }
            }
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Token"
                  }
                }
              }
            },
            "404": {
              description: "Token not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/pools": {
        get: {
          operationId: "getPools",
          summary: "Get list of pools",
          description: "Retrieve a list of liquidity pools on REF Finance",
          parameters: [
            {
              name: "tokenId",
              in: "query",
              description: "Filter pools containing this token",
              required: false,
              schema: {
                type: "string"
              }
            },
            {
              name: "limit",
              in: "query",
              description: "Maximum number of pools to return",
              required: false,
              schema: {
                type: "integer",
                default: 20
              }
            }
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      pools: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Pool"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/swap": {
        post: {
          operationId: "createSwap",
          summary: "Create a token swap",
          description: "Create a transaction for swapping tokens on REF Finance",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["accountId", "tokenIn", "tokenOut", "amountIn"],
                  properties: {
                    accountId: {
                      type: "string",
                      description: "NEAR account ID that will perform the swap"
                    },
                    tokenIn: {
                      type: "string",
                      description: "Token ID or symbol to swap from"
                    },
                    tokenOut: {
                      type: "string",
                      description: "Token ID or symbol to swap to"
                    },
                    amountIn: {
                      type: "string",
                      description: "Amount of input token to swap (in smallest unit)"
                    },
                    slippage: {
                      type: "number",
                      description: "Maximum slippage tolerance in percentage",
                      default: 0.5
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      transaction: {
                        $ref: "#/components/schemas/Transaction"
                      },
                      expectedOutput: {
                        type: "string",
                        description: "Expected amount of output token to receive"
                      },
                      priceImpact: {
                        type: "number",
                        description: "Price impact of the swap in percentage"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Bad request",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/price": {
        get: {
          operationId: "getPrice",
          summary: "Get token price",
          description: "Get the price of a token in terms of another token",
          parameters: [
            {
              name: "tokenIn",
              in: "query",
              description: "Token ID or symbol to get price for",
              required: true,
              schema: {
                type: "string"
              }
            },
            {
              name: "tokenOut",
              in: "query",
              description: "Token ID or symbol to use as quote",
              required: false,
              schema: {
                type: "string",
                default: "wrap.near"
              }
            }
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      price: {
                        type: "string",
                        description: "Price of tokenIn in terms of tokenOut"
                      },
                      tokenIn: {
                        $ref: "#/components/schemas/Token"
                      },
                      tokenOut: {
                        $ref: "#/components/schemas/Token"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Token: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Token contract ID"
            },
            name: {
              type: "string",
              description: "Token name"
            },
            symbol: {
              type: "string",
              description: "Token symbol"
            },
            decimals: {
              type: "integer",
              description: "Token decimals"
            },
            icon: {
              type: "string",
              description: "Token icon URL"
            },
            price: {
              type: "string",
              description: "Token price in USD"
            }
          }
        },
        Pool: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Pool ID"
            },
            tokens: {
              type: "array",
              description: "Tokens in the pool",
              items: {
                $ref: "#/components/schemas/Token"
              }
            },
            fee: {
              type: "number",
              description: "Pool fee percentage"
            },
            tvl: {
              type: "string",
              description: "Total value locked in USD"
            },
            volume24h: {
              type: "string",
              description: "24-hour trading volume in USD"
            }
          }
        },
        Transaction: {
          type: "object",
          properties: {
            signerId: {
              type: "string",
              description: "NEAR account ID that will sign the transaction"
            },
            receiverId: {
              type: "string",
              description: "Contract that will receive the transaction"
            },
            actions: {
              type: "array",
              description: "Actions to perform in the transaction",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Type of action"
                  },
                  params: {
                    type: "object",
                    description: "Action parameters"
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec);
} 