import type { Request, Response } from "express";
import { ZodError } from "zod";

import {
  recordEvent,
  fetchEvents,
  fetchEventById,
  recordBulkEvents,
  verifyEvent,
} from "../services/events.service";
import {  createEventSchema } from "../validators/event.validator";

import {
  eventErrorResponse,
  eventSuccessResponse,
  eventsSuccessResponse,
  type ApiError,
  bulkEventSuccessResponse,
} from "../utils/responses";
import type { FilterType } from "../repositories/events.repository";

function getValidationCode(issue: ZodError["issues"][number], body: unknown): string {
  const field = issue.path.find((p) => typeof p === "string");
  const index = issue.path.find((p) => typeof p === "number");

  const target = 
    typeof index === "number" && Array.isArray(body)
      ? body[index]
      : body;

  if (
    issue.code === "invalid_type" &&
    typeof field === "string" &&
    typeof target === "object" &&
    target !== null &&
    !Object.prototype.hasOwnProperty.call(target, field)
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

function getValidationMessage(
  issue: ZodError["issues"][number],
  code: string,
): string {
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
  return error.issues.map((issue) => {
    const code = getValidationCode(issue, body);
    return {
      field: issue.path.join("."),
      message: getValidationMessage(issue, code),
      code,
    };
  });
}

export async function createEvent(req: Request, res: Response) {
  const result = createEventSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json(eventErrorResponse(formatValidationErrors(result.error, req.body)));
  }

  try {
    const event = await recordEvent(result.data, {
      ip_address: req.ip ?? req.socket.remoteAddress ?? null,
      user_agent: req.headers["user-agent"] ?? null,
    });
    return res.status(201).json(eventSuccessResponse(event));
  } catch (err) {
    return res.status(500).json(
      eventErrorResponse([
        {
          field: "",
          message: "Failed to save event",
          code: "DATABASE_ERROR",
        },
      ]),
    );
  }
}

export const createBulkEvents = async (req: Request, res: Response) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json(eventErrorResponse([{
      field: 'body',
      message: 'Request body must be an array.',
      code: 'INVALID_TYPE',
    }]))
  }

  if (req.body.length === 0) {
    return res.status(400).json(eventErrorResponse([{
      field: 'body',
      message: 'Batch must contain at least one event.',
      code: 'EMPTY_BATCH',
    }]))
  }

  if (req.body.length > 100) {
    return res.status(400).json(eventErrorResponse([{
      field: 'body',
      message: 'Batch cannot exceed 100 events.',
      code: 'BATCH_TOO_LARGE',
    }]))
  }

  const allErrors: ApiError[] = []

  for (let i = 0; i < req.body.length; i++) {
    const result = createEventSchema.safeParse(req.body[i])
    if (!result.success) {
      const errors = formatValidationErrors(result.error, req.body[i])
      errors.forEach((error) => {
        allErrors.push({
          ...error,
          field: `${i}.${error.field}`,
        })
      })
    }
  }

  if (allErrors.length > 0) {
    return res.status(400).json(eventErrorResponse(allErrors))
  }

  try {
    const events = await recordBulkEvents(req.body, {
      ip_address: req.ip ?? req.socket.remoteAddress ?? null,
      user_agent: req.headers["user-agent"] ?? null,
    });
    return res.status(201).json(bulkEventSuccessResponse(events));
  } catch (err) {
    return res.status(500).json(
      eventErrorResponse([{
        field: "",
        message: "Failed to save events",
        code: "DATABASE_ERROR",
      }]),
    );
  }
};

export async function verifyEventById(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];

    if (!id) {
      return res.status(400).json(
        eventErrorResponse([
          {
            field: "id",
            message: "Event id is required.",
            code: "MISSING_FIELD",
          },
        ]),
      );
    }

    const verificationResult = await verifyEvent(id);

    if (!verificationResult) {
      return res.status(404).json(
        eventErrorResponse([
          {
            field: "id",
            message: "Event not found for verification.",
            code: "NOT_FOUND",
          },
        ]),
      );
    }

    return res.status(200).json({
      ok: true,
      intact: verificationResult.intact,
      event: eventSuccessResponse(verificationResult.event).event,
    });
  } catch (err) {
    return res.status(500).json(
      eventErrorResponse([
        {
          field: "",
          message: "Failed to execute event integrity check",
          code: "DATABASE_ERROR",
        },
      ]),
    );
  }
}

export async function getAllEvents(req: Request, res: Response) {
  try {
    const { actor_id, action, resource_type, resource_id, from, to, limit, offset } = req.query;

    const filters: FilterType = {};
    if (typeof actor_id === "string") filters.actor_id = actor_id;
    if (typeof action === "string") filters.action = action;
    if (typeof resource_type === "string") filters.resource_type = resource_type;
    if (typeof resource_id === "string") filters.resource_id = resource_id;
    if (typeof from === "string") filters.from = from;
    if (typeof to === "string") filters.to = to;
    if (limit) filters.limit = Number(limit);
    if (offset) filters.offset = Number(offset);

    const result = await fetchEvents(filters);
    return res.status(200).json(eventsSuccessResponse(result));
  } catch (err) {
    return res.status(500).json(
      eventErrorResponse([
        {
          field: "",
          message: "Failed to fetch events",
          code: "DATABASE_ERROR",
        },
      ]),
    );
  }
}

export async function getEventById(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];

    if (!id) {
      return res.status(400).json(
        eventErrorResponse([
          {
            field: "id",
            message: "Event id is required.",
            code: "MISSING_FIELD",
          },
        ]),
      );
    }

    const event = await fetchEventById(id);

    if (!event) {
      return res.status(404).json(
        eventErrorResponse([
          {
            field: "id",
            message: "Event not found.",
            code: "NOT_FOUND",
          },
        ]),
      );
    }

    return res.status(200).json(eventSuccessResponse(event));
  } catch (err) {
    return res.status(500).json(
      eventErrorResponse([
        {
          field: "",
          message: "Failed to fetch event",
          code: "DATABASE_ERROR",
        },
      ]),
    );
  }
}
