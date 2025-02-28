import type { Account } from "viem";
import { EventBus } from "../comms";
import { ExecutorAgent } from "./executor";
import { ObserverAgent } from "./observer";
import { TaskManagerAgent } from "./task-manager";
import { CdpAgent } from "./cdp-agent";
import { HederaAgent } from "./hedera-agent";
import { AIProvider } from "../services/ai/types";

/**
 * Registers the agents and returns them
 * @returns The registered agents
 */
export const registerAgents = (eventBus: EventBus, account: Account, aiProvider : AIProvider, recallStorage: any, atcpipProvider: any) => {
  console.log("======== Registering agents =========");

  // Initialize agents with account
  const executorAgent = new ExecutorAgent(
    'executor',
    eventBus,
    account,
    recallStorage,
    atcpipProvider
  );
  console.log(`[registerAgents] executor agent initialized.`);

  console.log(`[registerAgents] initializing observer agent...`);
  
  const observerAgent = new ObserverAgent(
    'observer',
    eventBus,
    account,
    aiProvider,
    recallStorage,
    atcpipProvider
  );
  console.log(`[registerAgents] observer agent initialized with address: ${account.address}`);

  const taskManagerAgent = new TaskManagerAgent(
    'task-manager',
    eventBus,
    account,
    recallStorage,
    atcpipProvider
  );
  console.log(`[registerAgents] task manager agent initialized.`);

  // Initialize CDP agent
  const cdpagent = new CdpAgent("cdp-agent", eventBus  , recallStorage , atcpipProvider);
  console.log(`[registerAgents] cdp agent initialized.`);

  // Initialize Hedera agent
  const hederaConfig = {
    accountId: process.env.HEDERA_ACCOUNT_ID || '0.0.123456',
    privateKey: process.env.HEDERA_PRIVATE_KEY || 'your-private-key',
    network: (process.env.HEDERA_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'previewnet'
  };
  
  console.log(`[registerAgents] Initializing Hedera agent with account ID: ${hederaConfig.accountId} on network: ${hederaConfig.network}`);
  console.log(`[registerAgents] Private key available: ${!!hederaConfig.privateKey}`);
  
  const hederaAgent = new HederaAgent(
    'hedera-agent',
    eventBus,
    hederaConfig,
    aiProvider
  );
  console.log(`[registerAgents] hedera agent initialized.`);

  // Register event handlers
  registerEventHandlers(eventBus, {
    executorAgent,
    observerAgent,
    taskManagerAgent,
    cdpagent,
    hederaAgent,
  });

  console.log("all events registered");

  return {
    executorAgent,
    observerAgent,
    taskManagerAgent,
    cdpagent,
    hederaAgent,
  };
};

function registerEventHandlers(eventBus: EventBus, agents: any) {
  // Observer <-> Task Manager
  eventBus.register(`observer-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`observer-task-manager`, data)
  );

  // Task Manager <-> CDP
  eventBus.register(`task-manager-cdp`, (data) =>
    agents.cdpAgent.handleEvent(`task-manager-cdp`, data)
  );
  eventBus.register(`cdp-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`cdp-task-manager`, data)
  );

  // Task Manager <-> Observer
  eventBus.register(`task-manager-observer`, (data) =>
    agents.observerAgent.handleEvent(`task-manager-observer`, data)
  );

  // Task Manager <-> Executor
  eventBus.register(`task-manager-executor`, (data) =>
    agents.executorAgent.handleEvent(`task-manager-executor`, data)
  );
  eventBus.register(`executor-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`executor-task-manager`, data)
  );

  // Task Manager <-> Hedera Agent
  eventBus.register(`task-manager-hedera`, (data) =>
    agents.hederaAgent.handleEvent(`task-manager-hedera`, data)
  );
  eventBus.register(`hedera-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`hedera-task-manager`, data)
  );
}
