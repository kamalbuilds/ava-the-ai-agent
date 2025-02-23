import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import type { Environment } from "./env";
// import { thoughtsRouter, walletRouter } from "./routes";
// import { cdpRouter } from "./routes/cdp";
// import { observerRouter } from "./routes/observer";
// import { taskRouter } from "./routes/task";
// import { settingsRouter } from "./routes/settings";
import { settingsMiddleware } from "./middleware/settings";

const app = new Hono<Environment>();

app.use("*", logger());
app.use("*", cors());
app.use("*", settingsMiddleware);

// Mount all routers
// app.route("/api/thoughts", thoughtsRouter);
// app.route("/api/wallet", walletRouter);
// app.route("/api/cdp", cdpRouter);
// app.route("/api/observer", observerRouter);
// app.route("/api/tasks", taskRouter);
// app.route("/api/settings", settingsRouter);

export { app };
