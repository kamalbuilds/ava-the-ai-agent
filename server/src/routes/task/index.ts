import { Hono } from "hono";
import type { Environment } from "../../env";
import { agents } from "../..";

const router = new Hono<Environment>();

router.get("/", async (c) => {
    try {
        const tasks = await agents.taskManagerAgent.getTasks();
        return c.json({ success: true, tasks });
    } catch (error) {
        return c.json({ success: false, error: "Failed to fetch tasks" }, 500);
    }
});

export { router as taskRouter }; 