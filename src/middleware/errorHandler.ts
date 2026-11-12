import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/errors";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
    res.status(409).json({ error: "A record with one of these values already exists." });
    return;
  }

  if (error instanceof Error && error.message.includes("FOREIGN KEY constraint failed")) {
    res.status(400).json({ error: "The referenced record does not exist or cannot be removed." });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error." });
};
