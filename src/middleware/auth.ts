import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import type { JwtPayload } from "../types";
import { ApiError } from "../utils/errors";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "A Bearer token is required."));
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (!payload.userId || !payload.email || !["customer", "admin"].includes(payload.role)) {
      throw new ApiError(401, "Invalid authentication token.");
    }
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: ""
    };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authentication token."));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    next(new ApiError(403, "Administrator access is required."));
    return;
  }
  next();
}
