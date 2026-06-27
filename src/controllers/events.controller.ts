import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createEventSchema } from "../validators/event.validator";
import { recordEvent } from "../services/events.service";
import {
  eventErrorResponse,
  eventSuccessResponse,
  type ApiError,
} from "../utils/responses";

function getValidationCode(issue: ZodError["issues"][number], body: unknown): string {
  const field = issue.path[0];

  if (
    issue.code === "invalid_type" &&
    typeof field === "string" &&
    typeof body === "object" &&
    body !== null &&
    !Object.prototype.hasOwnProperty.call(body, field)
  ) {
    return "MISSING_FIELD";
  }

  if (issue.code === "invalid_type") {
    return "INVALID_TYPE";
  }

  if (issue.code === "too_small") {
    return "EMPTY_FIELD";
  }

  return "VALIDATION_ERROR";
}

function getValidationMessage(issue: ZodError["issues"][number], code: string): string {
  const field = issue.path.join(".");

  if (code === "MISSING_FIELD") {
    return `${field} is required.`;
  }

  if (code === "EMPTY_FIELD") {
    return `${field} cannot be empty.`;
  }

  if (code === "INVALID_TYPE") {
    return `${field} has the wrong type.`;
  }

  return issue.message;
}

function formatValidationErrors(error: ZodError, body: unknown): ApiError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: getValidationMessage(issue, getValidationCode(issue, body)),
    code: getValidationCode(issue, body),
  }));
}

export async function createEvent(req: Request, res: Response) {
  const result = createEventSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(eventErrorResponse(formatValidationErrors(result.error, req.body)));
  }

  try {
    const event = await recordEvent(result.data, {
      ip_address: req.ip ?? req.socket.remoteAddress ?? null,
      user_agent: req.headers['user-agent'] ?? null,
    });
    return res.status(201).json(eventSuccessResponse(event));
  } catch (err) {
    return res.status(500).json(eventErrorResponse([{
      field: '',
      message: 'Failed to save event',
      code: 'DATABASE_ERROR'
    }]))
  }
}