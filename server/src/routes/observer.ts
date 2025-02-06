import { Hono } from "hono";
import { ObserverAgent } from "../agents/observer";
import { AIFactory } from "../services/ai/factory";
import type { Environment } from "../env";
import { account, eventBus } from "../setup";

interface Variables {
  agents: Record<string, any>;
}

const observerRouter = new Hono<Environment, Variables>();

observerRouter.post("/initialize", async (c) => {
  try {
    const { settings } = await c.req.json();

    // Create AI provider based on user settings
    const aiProvider = AIFactory.createProvider({
      provider: settings.aiProvider.provider,
      apiKey: settings.aiProvider.apiKey,
      enablePrivateCompute: settings.enablePrivateCompute,
      modelName: settings.aiProvider.modelName
    });

    // Initialize observer agent with settings
    const observer = new ObserverAgent(
      "observer",
      eventBus,
      account,
      aiProvider
    );

    // Store the agent instance
    c.set("agents", {
      ...c.get("agents"),
      observer
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to initialize observer:", error);
    return c.json({ error: "Failed to initialize observer" }, 500);
  }
});

// ... rest of routes ...

export { observerRouter }; 