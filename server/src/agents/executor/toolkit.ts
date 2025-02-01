import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import type { Account } from "viem";
import { z } from "zod";
import env from "../../env";
import {
  deleteTask,
  retrieveTaskById,
  retrieveTasks,
  storeTask,
  updateTask,
} from "../../memory";
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
} from "viem";
import { getChain } from "../../utils/chain";

export const getTransactionDataTool = (account: Account) =>
  tool({
    description: "A tool that transforms the tasks into transactions.",
    parameters: z.object({
      tasks: z.array(
        z.object({
          task: z.string(),
          taskId: z.string().nullable(),
        })
      ),
    }),
    execute: async ({
      tasks,
    }: {
      tasks: { task: string; taskId: string | null }[];
    }) => {
      console.log("======== getTransactionData Tool =========");
      console.log(`[getTransactionData] fetching transactions data from Brian`);
      const transactions = await Promise.all(
        tasks.map(
          async ({ task, taskId }: { task: string; taskId: string | null }) => {
            console.log(
              `[getTransactionData] fetching transaction data for task: "${task}"`
            );
            try {
              const brianResponse = await fetch(
                `${
                  env.BRIAN_API_URL ||
                  "https://api.brianknows.org/api/v0/agent/transaction"
                }`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    prompt: task,
                    chainId: env.CHAIN_ID,
                    address: account.address,
                  }),
                  headers: {
                    "Content-Type": "application/json",
                    "x-brian-api-key": env.BRIAN_API_KEY,
                  },
                }
              );

              console.log(brianResponse);
              const { result } = await brianResponse.json();

              if (!result) {
                return null;
              }

              const data = result[0].data;
              console.log(
                `[getTransactionData] Brian says: ${data.description}`
              );
              const steps = data.steps;

              return {
                task,
                steps,
                taskId,
                fromToken: data.fromToken,
                fromAmountUSD: `$${data.fromAmountUSD}`,
                toToken: data.toToken,
                toAmountUSD: `$${data.toAmountUSD}`,
                fromAmount: formatUnits(
                  data.fromAmount,
                  data.fromToken.decimals
                ),
                outputAmount: formatUnits(
                  data.toAmountMin,
                  data.toToken.decimals
                ),
              };
            } catch (error) {
              console.error(error);
              return null;
            }
          }
        )
      );

      if (transactions.length !== tasks.length) {
        return `Some transactions failed to fetch, please rewrite the tasks.`;
      }

      const validTransactions = transactions.filter(
        (transaction) => transaction !== null
      );

      const taskIds: any[] = [];
      for (const transaction of validTransactions) {
        if (transaction.taskId) {
          const { data: taskData } = await updateTask(
            transaction.taskId,
            transaction.task,
            transaction.steps,
            transaction.fromToken,
            transaction.toToken,
            transaction.fromAmount,
            transaction.outputAmount
          );
          taskIds.push({
            taskId: taskData![0].id,
            task: transaction.task,
            createdAt: taskData![0].created_at,
          });
        } else {
          const { data: taskData } = await storeTask(
            transaction.task,
            transaction.steps,
            transaction.fromToken,
            transaction.toToken,
            transaction.fromAmount,
            transaction.outputAmount
          );
          taskIds.push({
            taskId: taskData![0].id,
            task: transaction.task,
            createdAt: taskData![0].created_at,
          });
        }
      }

      console.log(`[getTransactionData] transactions fetched correctly.`);

      return taskIds;
    },
  });

export const getExecutorToolkit = (account: Account) => {
  return {
    getTransactionData: getTransactionDataTool(account),
    simulateTasks: tool({
      description:
        "A tool that simulates the output of all the tasks. It is useful to to check the outputs and to fix the inputs of other tasks. Always use this tool before the executeTransaction tool.",
      parameters: z.object({}),
      execute: async ({}) => {
        console.log("======== simulateTasks Tool =========");

        const { data: taskIds } = await retrieveTasks();

        if (!taskIds) {
          return `No tasks found.`;
        }

        const tasks = await Promise.all(
          taskIds.map(async ({ id: taskId }) => {
            const { data: taskData } = await retrieveTaskById(taskId);

            if (!taskData) {
              return `Transaction not found for task [id: ${taskId}].`;
            }

            if (!taskData[0].steps) {
              return `Transaction not found for task [id: ${taskId}].`;
            }

            return [
              `[taskId: ${taskId}] "${taskData[0].task}"`,
              `The transaction is from ${taskData[0].to_token.symbol} to ${taskData[0].from_token.symbol}.`,
              `The amount is ${taskData[0].from_amount} ${taskData[0].from_token.symbol} and the output amount is ${taskData[0].to_amount} ${taskData[0].to_token.symbol}.`,
              `Fix the task accordingly and return just the updated task.`,
            ].join("\n");
          })
        );

        const response = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: [
            `You have simulated all the tasks you need to execute. This is the output of the simulation:`,
            tasks.join("\n"),
            `Fix the tasks accordingly and return just the updated tasks.`,
            `When the tasks are updated, remind yourself to get the updated transaction data and then execute the tasks.`,
          ].join("\n"),
        });

        return response.text;
      },
    }),
    executeTransaction: tool({
      description:
        "A tool that executes a transaction. Execute transactions in chronological order.",
      parameters: z.object({
        task: z.string(),
        taskId: z.string(),
      }),
      execute: async ({ task, taskId }) => {
        console.log("======== executeTransaction Tool =========");
        console.log(
          `[executeTransaction] executing transaction with task id: ${taskId}`
        );

        const { data: taskData } = await retrieveTaskById(taskId);

        if (!taskData) {
          return `Transaction not found for task: "${task}" [id: ${taskId}].`;
        }

        const walletClient = createWalletClient({
          account,
          chain: getChain(parseInt(env.CHAIN_ID)),
          transport: http(),
        });
        const publicClient = createPublicClient({
          chain: getChain(parseInt(env.CHAIN_ID)),
          transport: http(),
        });

        const hashes: string[] = [];

        for (const step of taskData[0].steps) {
          try {
            const hash = await walletClient.sendTransaction({
              to: step.to,
              value: BigInt(step.value),
              data: step.data,
            });
            console.log(`[executeTransaction] transaction hash: ${hash}`);
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
            });
            console.log(
              `[executeTransaction] transaction receipt: ${receipt.transactionHash}`
            );
            hashes.push(receipt.transactionHash);
          } catch (error) {
            console.log(
              `[executeTransaction] transaction for task "${task}" failed: ${error}`
            );
            return `[${new Date().toISOString()}] Transaction errored for task: "${task}". The error is: ${JSON.stringify(
              error,
              null,
              2
            )}`;
          }
        }

        await deleteTask(taskId);

        return `[${new Date().toISOString()}] Transaction executed successfully for task: "${task}". Transaction hashes: ${hashes.join(
          ", "
        )}`;
      },
    }),

  };
};

export const getOdosSwapTransaction = (account: Account) => {
  return {
    generateQuote: tool({
      description: `This will generate Quote for the swap. 
       It takes the following inputs:
        - The source chain ID
        - The token on the source chain (address)
        - The token on the destination chain (address)
        - The amount to transfer (in the smallest unit of the token)
        - The address from which the tokens are being transferred
      `,
      parameters: z.object({
        chainId: z.number().describe("Chain Id of the Chain"),
        fromToken: z.string().describe("Address of the source token"),
        toToken: z.string().describe("Address of the destination token"),
        fromAmount: z
          .string()
          .describe(
            "The amount to be transferred from the source chain, specified in the smallest unit of the token (e.g., wei for ETH)."
          ),
      }),
      execute: async ({ chainId, fromToken, toToken, fromAmount }) => {
        console.log(
          "======== Fetchin Quote for the Transaction Tool ========="
        );
        console.log(` Fetching Quote`);

        const quoteConfig = {
          chainId,
          inputToken: [
            {
              tokenAddress: fromToken,
              amount: fromAmount,
            },
          ],
          outputTokens: [
            {
              tokenAddress: toToken, // checksummed output token address
              proportion: 1,
            },
          ],
          userAddr: account.address, // checksummed user address
          slippageLimitPercent: 0.3, // set your slippage limit percentage (1 = 1%),
          referralCode: 0, // referral code (recommended)
          disableRFQs: true,
          compact: true,
        };

        const quoteUrl = "https://api.odos.xyz/sor/quote/v2";

        const response = await fetch(quoteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quoteConfig),
        });
        if (response.status === 200) {
          const quote = await response.json();

          console.log("Quote fetched successfully >>>", quote);

          console.log("======== Assembling transaction =========");
          console.log(` Fetching Quote`);

          const assembleUrl = "https://api.odos.xyz/sor/assemble";

          const assembleRequestBody = {
            userAddr: account.address,
            pathId: quote.pathId,
            simulate: true,
          };

          try {
            const assembledTransactionRaw = await fetch(assembleUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(assembleRequestBody),
            });

            const assembledTransaction = await assembledTransactionRaw.json();

            console.log(
              "Transaction fetched successfully",
              assembledTransaction
            );

            console.log("======== Executing transaction =========");

            const walletClient = createWalletClient({
              account,
              chain: getChain(parseInt(env.CHAIN_ID)),
              transport: http(),
            });
            const publicClient = createPublicClient({
              chain: getChain(parseInt(env.CHAIN_ID)),
              transport: http(),
            });

            const hash = await walletClient.sendTransaction(
              assembledTransaction.transaction
            );

            console.log(`[executeTransaction] transaction hash: ${hash}`);
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
            });
            console.log(
              `[executeTransaction] transaction receipt: ${receipt.transactionHash}`
            );

            return `[${new Date().toISOString()}] Transaction executed successfully. Transaction hash: ${
              receipt.transactionHash
            }`;
          } catch (error) {
            console.log("Error in creating transaction", error);
          }
        } else {
          console.log("Error in creating quote>>>", response);
        }
      },
    }),
  };
};
