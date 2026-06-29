import express, { type Request, type Response } from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db/connection";
import healthRouter from "./routes/health.routes";
import eventsRouter from "./routes/events.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { eventErrorResponse } from "./utils/responses";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/events", eventsRouter);

app.use((_req: Request, res: Response) => {
  return res.status(404).json(
    eventErrorResponse([
      {
        field: "route",
        message: "The requested path or endpoint does not exist.",
        code: "ROUTE_NOT_FOUND",
      },
    ])
  );
});

app.use(errorMiddleware);

export async function startServer(port: number) {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Database migrations complete');

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
