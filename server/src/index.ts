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
import { RecallStorage } from "./agents/plugins/recall-storage/index";
import { ATCPIPProvider } from "./agents/plugins/atcp-ip";

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

async function initializeServices() {
  try {
    // Initialize core services
    const eventBus = new EventBus();

    const aiProvider = AIFactory.createProvider({
      provider: 'groq',
      apiKey: env.GROQ_API_KEY as string,
      modelName: 'gemma2-9b-it'
    });

    // Create account from private key
    const account = privateKeyToAccount(env.WALLET_PRIVATE_KEY as `0x${string}`);

    // Initialize Recall Storage and wait for it
    const recallStorage = new RecallStorage({
      network: 'testnet',
      syncInterval: 2 * 60 * 1000, // 2 minutes
      batchSize: 4, // 4KB
      eventBus,
      bucketAlias: 'ava'
    });

    // Wait for client initialization
    await recallStorage.waitForInitialization();

    // Initialize ATCP/IP Provider
    const atcpipProvider = new ATCPIPProvider({
      agentId: 'ava'
    });

    // Initialize agents
    console.log("======== Registering agents =========");

    const taskManager = new TaskManagerAgent(
      'task-manager',
      eventBus,
      account,
      recallStorage,
      atcpipProvider
    );
    console.log("[registerAgents] task manager agent initialized.");

    const executor = new ExecutorAgent(
      'executor',
      eventBus,
      account,
      recallStorage,
      atcpipProvider
    );
    console.log("[registerAgents] executor agent initialized.");

    console.log("[registerAgents] initializing observer agent...");

    const observer = new ObserverAgent(
      'observer',
      eventBus,
      account,
      aiProvider,
      recallStorage,
      atcpipProvider
    );
    console.log("[registerAgents] observer agent initialized with address:", account.address);

    const taskManagerAgent = new TaskManagerAgent(
      'task-manager',
      eventBus,
      account,
      recallStorage,
      atcpipProvider
    );
    console.log("[registerAgents] task manager agent initialized.");

    console.log("all events registered");

    // Setup WebSocket server
    const WS_PORT = 3001;
    const wss = new WebSocketServer({ port: WS_PORT });

    wss.on("connection", (ws: WebSocket) => {
      console.log(`[WebSocket] Client connected on port ${WS_PORT}`);

      // Forward events from event bus to WebSocket clients
      eventBus.on(
        "agent-action",
        async (data: { agent: string; action: string }) => {
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "assistant",
              content: `[${data.agent}] ${data.action}`,
              agentName: data.agent,
            })
          );
        }
      );

      eventBus.on(
        "agent-response",
        async (data: { agent: string; message: string }) => {
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "assistant",
              content: data.message,
              agentName: data.agent,
            })
          );
        }
      );

      eventBus.on("agent-error", async (data: { agent: string; error: string }) => {
        ws.send(
          JSON.stringify({
            type: "agent-message",
            timestamp: new Date().toLocaleTimeString(),
            role: "error",
            content: `Error in ${data.agent}: ${data.error}`,
            agentName: data.agent,
          })
        );
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
              enablePrivateCompute: data.settings.enablePrivateCompute,
            });

            // Update agents with new settings
            observer.updateAIProvider(newProvider);
            
            taskManagerAgent.updateAIProvider(newProvider);

            eventBus.emit("agent-action", {
              agent: "system",
              action: "Updated AI provider settings",
            });
          } else if (data.type === "command") {
            // Add user message to chat
            const messageData = {
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "user",
              content: data.command,
              agentName: "user",
            };
            ws.send(JSON.stringify(messageData));

            if (data.command === "stop") {
              observer.stop();
              eventBus.emit("agent-action", {
                agent: "system",
                action: "All agents stopped",
              });
            } else {
              eventBus.emit("agent-action", {
                agent: "system",
                action: "Starting task processing",
              });
              await observer.processTask(data.command);
            }
          }
        } catch (error) {
          console.error("[WebSocket] Error processing message:", error);
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "error",
              content: "Error processing command",
              agentName: "system",
            })
          );
        }
      });

      ws.on("close", () => {
        eventBus.unsubscribe("agent-action", async (data) => {
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "assistant",
              content: `[${data.agent}] ${data.action}`,
              agentName: data.agent,
            })
          );
        });
        eventBus.unsubscribe("agent-response", async (data) => {
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "assistant",
              content: data.message,
              agentName: data.agent,
            })
          );
        });
        eventBus.unsubscribe("agent-error", async (data) => {
          ws.send(
            JSON.stringify({
              type: "agent-message",
              timestamp: new Date().toLocaleTimeString(),
              role: "error",
              content: `Error in ${data.agent}: ${data.error}`,
              agentName: data.agent,
            })
          );
        });
      });
    });

    console.log(`[🔌] WebSocket Server running on ws://localhost:${WS_PORT}`);

  } catch (error) {
    console.error("Error initializing services:", error);
    process.exit(1);
  }
}

// Start the application
initializeServices().catch(error => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
