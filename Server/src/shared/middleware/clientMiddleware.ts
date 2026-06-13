import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { AppError } from "./error.middleware";

interface ClientJwtPayload {
  id: number;
  email: string;
  fname: string;
  lname: string;
}

export const clientMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const err: AppError = Object.assign(new Error("No token provided"), { statusCode: 401 });
    return next(err);
  }

  const token = authHeader.slice(7);

  let payload: ClientJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as ClientJwtPayload;
  } catch {
    const err: AppError = Object.assign(new Error("Invalid or expired token"), { statusCode: 401 });
    return next(err);
  }

  req.user = { id: String(payload.id), role: "customer" };
  next();
};
