import type { Request, Response, NextFunction } from "express";
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from "sequelize";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode ?? 500;
  if (process.env["NODE_ENV"] !== "production" && statusCode >= 500) {
    console.error(err);
  }

  // Zod v4 — duck-type check since instanceof ZodError is unreliable across entry points
  const asAny = err as any;
  if (Array.isArray(asAny.issues)) {
    const message = asAny.issues.map((e: any) => e.message).join("; ");
    res.status(400).json({ success: false, message });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path ?? "field";
    res.status(409).json({ success: false, message: `${field} already in use` });
    return;
  }

  if (err instanceof SequelizeValidationError) {
    const message = err.errors.map((e) => e.message).join("; ");
    res.status(400).json({ success: false, message });
    return;
  }

  const message = err.message ?? "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
