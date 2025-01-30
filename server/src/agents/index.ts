import type { Account } from "viem";
import { EventBus } from "../comms";
import { ExecutorAgent } from "./executor";
import { ObserverAgent } from "./observer";
import { TaskManagerAgent } from "./task-manager";
import { CdpAgent } from "./cdp-agent";
import figlet from "figlet";

/**
 * Registers the agents and returns them
 * @returns The registered agents
 */
export const registerAgents = (eventBus: EventBus, account: Account) => {
  console.log(figlet.textSync("AVA-2.0"));
  console.log("======== Registering agents =========");

  // Initialize agents
  const executorAgent = new ExecutorAgent("executor", eventBus, account);
  const observerAgent = new ObserverAgent("observer", eventBus);
  const taskManagerAgent = new TaskManagerAgent("task-manager", eventBus);
  const cdpAgent = new CdpAgent("cdp", eventBus);

  // Initialize CDP agent
  cdpAgent.initialize().catch(console.error);

  // Register event handlers
  registerEventHandlers(eventBus, {
    executorAgent,
    observerAgent,
    taskManagerAgent,
    cdpAgent,
  });

  return {
    executorAgent,
    observerAgent,
    taskManagerAgent,
    cdpAgent,
  };
};

function registerEventHandlers(eventBus: EventBus, agents: any) {
  // Register existing handlers
  eventBus.register(`observer-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`observer-task-manager`, data)
  );

  // Add CDP agent handlers
  eventBus.register(`task-manager-cdp`, (data) =>
    agents.cdpAgent.handleEvent(`task-manager-cdp`, data)
  );

  eventBus.register(`cdp-task-manager`, (data) =>
    agents.taskManagerAgent.handleEvent(`cdp-task-manager`, data)
  );

  // ... register other existing handlers
}
