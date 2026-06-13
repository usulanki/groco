import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { Admin, Role } from "../../models/index";
import type { AppError } from "./error.middleware";

interface AdminJwtPayload {
  id: number;
  username: string;
  email: string;
  fname: string;
  lname: string;
  role_id: number;
  store_id: number | null;
  role_code: string;
  outlet_id: number | null;
}

export const adminMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const err: AppError = Object.assign(new Error("No token provided"), { statusCode: 401 });
    return next(err);
  }

  const token = authHeader.slice(7);

  let payload: AdminJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminJwtPayload;
  } catch {
    const err: AppError = Object.assign(new Error("Invalid or expired token"), { statusCode: 401 });
    return next(err);
  }

  try {
    const dbAdmin = await Admin.findOne({
      where: { id: payload.id, is_deleted: false, is_active: true },
      include: [{ model: Role, where: { status: true, is_deleted: false }, required: true }],
    });

    if (!dbAdmin) {
      const err: AppError = Object.assign(new Error("Account or role is inactive"), { statusCode: 401 });
      return next(err);
    }

    req.admin = { id: payload.id, username: payload.username, email: payload.email, fname: payload.fname, lname: payload.lname, role_id: payload.role_id, store_id: payload.store_id ?? null, role_code: payload.role_code, outlet_id: payload.outlet_id ?? null };
    next();
  } catch {
    const err: AppError = Object.assign(new Error("Authentication failed"), { statusCode: 500 });
    next(err);
  }
};
