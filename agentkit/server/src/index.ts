import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { HumanMessage } from "@langchain/core/messages";
import * as readline from "readline";
import { getOrInitializeAgent } from "./agents/cdpAgent/agent";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const app = express();
const PORT = process.env.PORT || 8080;

// Start an HTTP server
const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // const agent = await getOrInitializeAgent();

  // runChatMode(agent);
});

// Create a WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", async (ws: WebSocket) => {
  console.log("New WebSocket connection established");

  let agent: ReturnType<typeof createReactAgent> | null;
  try {
    agent = await getOrInitializeAgent();
    const data = {
      type: "agent_response",
      message: `CDP Agent initialised`,
    };

    ws.send(JSON.stringify(data));
  } catch (error) {
    console.log("Error initializing agent", error);
    return;
  }

  ws.on("message", async (message: string) => {
    console.log("Received:", message);

    if (agent === null) {
      console.log("Agent not initialized");
    }

    const stream = await agent.stream(
      { messages: [{ content: message, role: "user" }] }, // The new message to send to the agent
      { configurable: { thread_id: "AgentKit Discussion" } } // Customizable thread ID for tracking conversations
    );

    console.log("stream response >>>", stream);

    let agentResponse = "";
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        agentResponse += chunk.agent.messages[0].content;
      }
    }
    console.log("agentResponse >>", agentResponse);

    const data = {
      type: "agent_response",
      message: `${agentResponse}`,
    };
    // ws.send(`Server received: ${message}`);

    // Echo message back to client
    ws.send(JSON.stringify(data));
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

app.get("/", (req, res) => {
  res.send("WebSocket server is running!");
});

async function runChatMode(agent: ReturnType<typeof createReactAgent>) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        { configurable: { thread_id: "AgentKit Discussion" } }
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}
