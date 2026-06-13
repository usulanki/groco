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
  if (process.env["NODE_ENV"] !== "production") {
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

  const statusCode = (err as AppError).statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
