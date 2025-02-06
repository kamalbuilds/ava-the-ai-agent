import { Hono } from "hono";
import { AIFactory } from "../services/ai/factory";

const settingsRouter = new Hono();

settingsRouter.post("/ai", async (c) => {
  try {
    const settings = await c.req.json();
    
    // Validate settings
    const provider = AIFactory.createProvider({
      provider: settings.provider,
      apiKey: settings.apiKey,
      enablePrivateCompute: settings.enablePrivateCompute
    });

    // Test the connection
    await provider.generateText("Test connection");

    // Store settings securely
    // TODO: Implement secure settings storage

    return c.json({ success: true });
  } catch (error) {
    console.error("Settings update failed:", error);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

export { settingsRouter }; 