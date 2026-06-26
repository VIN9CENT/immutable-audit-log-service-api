import express from "express";
import healthRouter from "./routes/health.routes";
import eventsRouter from "./routes/events.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/events", eventsRouter);

app.use(errorMiddleware);

export default app;
