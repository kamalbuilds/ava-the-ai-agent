import { Agent } from "../agent";
import type { EventBus } from "../../comms";
import type { AIProvider } from "../../services/ai/types";
import {
  Account,
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
} from "viem";
import { getChain } from "../../utils/chain";
import env from "../../env";

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

export class AaveAgent extends Agent {
  private account: Account;

  constructor(eventBus: EventBus, aiProvider: AIProvider, account: Account) {
    super("aave-agent", eventBus, aiProvider);

    this.account = account;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle task manager events
    this.eventBus.on("task-manager-aave-agent", async (data) => {
      try {
        await this.handleEvent("task-manager-aave-agent", data);
      } catch (error) {
        console.error(
          `[${this.name}] Error handling task manager request:`,
          error
        );
        this.eventBus.emit("agent-error", {
          agent: this.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  handleEvent(event: string, data: any): void {
    console.log(`[${this.name}] Handling event: ${event}`, data);
  }

  onStepFinish({ text, toolCalls, toolResults }: any): Promise<void> {
    // Implementation for onStepFinish
    console.log("onStepFinish");
    return Promise.resolve();
  }
}
