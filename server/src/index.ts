// src/index.ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import env from "./env";
import { registerAgents } from "./agents";
import { EventBus } from "./comms";
import { privateKeyToAccount } from "viem/accounts";
import figlet from "figlet";

console.log(figlet.textSync("AVA-2.0"));
console.log("======== Initializing Server =========");

// Initialize event bus and agents
const eventBus = new EventBus();
const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);
const agents = registerAgents(eventBus, account);

const PORT = env.PORT || 3001;

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`[🚀] Server running on http://localhost:${info.port}`);
  console.log(`[👀] Observer agent starting...`);
  agents.observerAgent.start(account.address);
});

export { agents };
