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
import turnkeyRouter from "./api/turnkey";
import zeroXRoutes from './routes/0x-routes';
import curvanceRoutes from './routes/curvance-routes';

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
app.route("/api/turnkey", turnkeyRouter);
app.use('/api/v1/0x', zeroXRoutes);
app.use('/api/v1/curvance', curvanceRoutes);

export { app };
