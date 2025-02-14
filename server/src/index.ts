// // src/index.ts
// import { serve } from "@hono/node-server";
// import { app } from "./app";
// import env from "./env";
// import { registerAgents } from "./agents";
// import { EventBus } from "./comms";
// import { privateKeyToAccount } from "viem/accounts";
// import { setupWebSocket } from "./websocket";
// import figlet from "figlet";
import { WebSocket, WebSocketServer } from "ws";
import { EventBus } from "./comms/event-bus";
import { ObserverAgent } from "./agents/observer";
import { TaskManagerAgent } from "./agents/task-manager";
import { ExecutorAgent } from "./agents/executor";
import { AIFactory } from "./services/ai/factory";
import env from "./env";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// console.log(figlet.textSync("AVA-2.0"));
// console.log("======== Initializing Server =========");

// // Initialize event bus and agents
// const eventBus = new EventBus();
// const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);
// export const agents = registerAgents(eventBus, account);

// const PORT = env.PORT || 3001;

// serve(
//   {
//     fetch: app.fetch,
//     port: PORT,
//   },
//   (info) => {
//     console.log(`[🚀] Server running on http://localhost:${info.port}`);
//     console.log(`[👀] Observer agent starting...`);

//     console.log("Event bus", eventBus);
//     // Setup WebSocket server
//     setupWebSocket(eventBus);

//     // agents.observerAgent.start(account.address);
//   }
// );

// Initialize core services
const eventBus = new EventBus();

// Initialize AI provider
const aiProvider = AIFactory.createProvider({
  provider: 'openai',
  apiKey: env.OPENAI_API_KEY,
  modelName: 'gpt-4o'
});

// Initialize agents
console.log("======== Registering agents =========");

// Create account from private key
const account = privateKeyToAccount(env.WALLET_PRIVATE_KEY as `0x${string}`);

const executorAgent = new ExecutorAgent("executor", eventBus, account);
console.log("[registerAgents] executor agent initialized.");

console.log("[registerAgents] initializing observer agent...");
const observerAgent = new ObserverAgent("observer", eventBus, account, aiProvider);
console.log("[registerAgents] observer agent initialized with address:", account.address);

const taskManagerAgent = new TaskManagerAgent(eventBus, aiProvider);
console.log("[registerAgents] task manager agent initialized.");

console.log("all events registered");

// Setup WebSocket server
const WS_PORT = 3001;
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws: WebSocket) => {
  console.log(`[WebSocket] Client connected on port ${WS_PORT}`);

  // Forward events from event bus to WebSocket clients
  eventBus.on("agent-action", async (data: { agent: string; action: string }) => {
    ws.send(JSON.stringify({
      type: "agent-message",
      timestamp: new Date().toLocaleTimeString(),
      role: "assistant",
      content: `[${data.agent}] ${data.action}`,
      agentName: data.agent
    }));
  });

  eventBus.on("agent-response", async (data: { agent: string; message: string }) => {
    ws.send(JSON.stringify({
      type: "agent-message",
      timestamp: new Date().toLocaleTimeString(),
      role: "assistant",
      content: data.message,
      agentName: data.agent
    }));
  });

  eventBus.on("agent-error", async (data: { agent: string; error: string }) => {
    ws.send(JSON.stringify({
      type: "agent-message",
      timestamp: new Date().toLocaleTimeString(),
      role: "error",
      content: `Error in ${data.agent}: ${data.error}`,
      agentName: data.agent
    }));
  });

  ws.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "settings") {
        // Update AI provider based on settings
        const newProvider = AIFactory.createProvider({
          provider: data.settings.aiProvider.provider,
          apiKey: data.settings.aiProvider.apiKey,
          modelName: data.settings.aiProvider.modelName,
          enablePrivateCompute: data.settings.enablePrivateCompute
        });

        // Update agents with new settings
        observerAgent.updateAIProvider(newProvider);
        taskManagerAgent.updateAIProvider(newProvider);
        
        eventBus.emit("agent-action", {
          agent: "system",
          action: "Updated AI provider settings"
        });
      }
      else if (data.type === "command") {
        // Add user message to chat
        const messageData = {
          type: "agent-message",
          timestamp: new Date().toLocaleTimeString(),
          role: "user",
          content: data.command,
          agentName: "user"
        };
        ws.send(JSON.stringify(messageData));

        if (data.command === "stop") {
          observerAgent.stop();
          eventBus.emit("agent-action", {
            agent: "system",
            action: "All agents stopped"
          });
        } else {
          eventBus.emit("agent-action", {
            agent: "system",
            action: "Starting task processing"
          });
          await observerAgent.processTask(data.command);
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error processing message:", error);
      ws.send(JSON.stringify({
        type: "agent-message",
        timestamp: new Date().toLocaleTimeString(),
        role: "error",
        content: "Error processing command",
        agentName: "system"
      }));
    }
  });

  ws.on("close", () => {
    eventBus.unsubscribe("agent-action", async (data) => {
      ws.send(JSON.stringify({
        type: "agent-message",
        timestamp: new Date().toLocaleTimeString(),
        role: "assistant",
        content: `[${data.agent}] ${data.action}`,
        agentName: data.agent
      }));
    });
    eventBus.unsubscribe("agent-response", async (data) => {
      ws.send(JSON.stringify({
        type: "agent-message",
        timestamp: new Date().toLocaleTimeString(),
        role: "assistant",
        content: data.message,
        agentName: data.agent
      }));
    });
    eventBus.unsubscribe("agent-error", async (data) => {
      ws.send(JSON.stringify({
        type: "agent-message",
        timestamp: new Date().toLocaleTimeString(),
        role: "error",
        content: `Error in ${data.agent}: ${data.error}`,
        agentName: data.agent
      }));
    });
  });
});

console.log(`[🔌] WebSocket Server running on ws://localhost:${WS_PORT}`);
