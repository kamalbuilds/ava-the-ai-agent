import { Hono } from "hono";
import type { Environment } from "../../env";
import { agents } from "../..";

const app = new Hono<Environment>();

app.post("/message", async (c) => {
    try {
        console.log("CDP Agent request received");
        const { prompt } = await c.req.json();

        if (!prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }

        const response = await agents.cdpagent.processMessage(prompt);
        return c.json({ response });
    } catch (error) {
        console.error("Error processing CDP message:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

export default app; 