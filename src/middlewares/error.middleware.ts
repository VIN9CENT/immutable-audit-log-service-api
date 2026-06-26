import type { ErrorRequestHandler } from "express";
import { eventErrorResponse } from "../utils/responses";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json(
      eventErrorResponse([
        {
          field: "body",
          message: "Request body must be valid JSON.",
          code: "INVALID_JSON",
        },
      ]),
    );
  }

  return res.status(500).json(
    eventErrorResponse([
      {
        field: "server",
        message: "An unexpected error occurred.",
        code: "INTERNAL_SERVER_ERROR",
      },
    ]),
  );
};
