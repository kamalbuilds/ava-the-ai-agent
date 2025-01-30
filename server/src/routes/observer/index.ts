import { Hono } from "hono";
import type { Environment } from "../../env";
import { agents } from "../..";

const router = new Hono<Environment>();

router.post("/start", async (c) => {
    try {
        console.log("Starting observer agent loop");
        if (!agents.observerAgent.address) {
            throw new Error("Observer agent address not set");
        }
        await agents.observerAgent.start(agents.observerAgent.address);
        return c.json({ success: true, message: "Observer agent started" });
    } catch (error) {
        console.error("Error starting observer:", error);
        return c.json({ success: false, error: "Failed to start observer" }, 500);
    }
});

export { router as observerRouter }; 