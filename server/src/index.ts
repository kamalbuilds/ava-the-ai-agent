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

import { EventBus } from "./comms";
import { registerAgents } from "./agents";
import { privateKeyToAccount } from "viem/accounts";
import env from "./env";

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

const eventBus = new EventBus();
const WS_PORT = 3002;
const wss = new WebSocketServer({ port: WS_PORT });
const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);
export const agents = registerAgents(eventBus, account);

wss.on("connection", (ws: WebSocket) => {
  console.log(`[WebSocket] Client connected on port ${WS_PORT}`);

  setInterval(() => {
    ws.send(
      JSON.stringify({
        type: "agent-event",
        agent: "server-agent",
        action: "server-action",
      })
    );
  }, 5000);

  // Forward agent events to the client
  const forwardEvent = (data: any) => {
    console.log("Sending event", data);

    ws.send(
      JSON.stringify({
        type: "agent-event",
        ...data,
      })
    );
  };

  eventBus.subscribe("agent-action", forwardEvent);
  eventBus.subscribe("agent-response", forwardEvent);
  eventBus.subscribe("agent-error", forwardEvent);

  ws.on("message", async (message: string) => {
    try {
      console.log("Message passed", message);

      const data = JSON.parse(message);
      console.log("data", data);

      if (data.type === "command") {
        if (data.command === "stop") {
          // Stop all agent activities
          agents.observerAgent.stop();
          eventBus.emit("agent-action", {
            agent: "system",
            action: "All agents stopped",
          });
        } else {
          // Start task processing
          eventBus.emit("agent-action", {
            agent: "system",
            action: "Starting task processing",
          });

          // Start with observer agent
          await agents.observerAgent.processTask(data.command);
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      eventBus.emit("agent-error", {
        agent: "system",
        error: "Failed to process command",
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    eventBus.unsubscribe("agent-action", forwardEvent);
    eventBus.unsubscribe("agent-response", forwardEvent);
    eventBus.unsubscribe("agent-error", forwardEvent);
  });
});
