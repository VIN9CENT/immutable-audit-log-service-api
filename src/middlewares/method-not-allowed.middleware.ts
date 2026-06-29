import type { Request, Response } from "express";
import { eventErrorResponse } from "../utils/responses";

export function methodNotAllowed(_req: Request, res: Response) {
  return res.status(405).json(
    eventErrorResponse([
      {
        field: "",
        message: "Method not allowed.",
        code: "METHOD_NOT_ALLOWED",
      },
    ])
  );
}