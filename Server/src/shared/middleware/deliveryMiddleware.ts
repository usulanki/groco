import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import DeliveryAgent from "../../models/deliveryAgent.model";
import type { AppError } from "./error.middleware";

interface DeliveryJwtPayload {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string;
  store_id: number | null;
  outlet_id: number | null;
  type: string;
}

export const deliveryMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const err: AppError = Object.assign(new Error("No token provided"), { statusCode: 401 });
    return next(err);
  }

  const token = authHeader.slice(7);

  let payload: DeliveryJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as DeliveryJwtPayload;
  } catch {
    const err: AppError = Object.assign(new Error("Invalid or expired token"), { statusCode: 401 });
    return next(err);
  }

  if (payload.type !== "delivery") {
    const err: AppError = Object.assign(new Error("Invalid token type"), { statusCode: 401 });
    return next(err);
  }

  try {
    const agent = await DeliveryAgent.findOne({
      where: { id: payload.id, is_deleted: false, status: true },
    });

    if (!agent) {
      const err: AppError = Object.assign(new Error("Account not found or deactivated"), { statusCode: 401 });
      return next(err);
    }

    req.deliveryAgent = {
      id:         agent.id,
      first_name: agent.first_name,
      last_name:  agent.last_name,
      email:      agent.email,
      mobile:     agent.mobile,
      store_id:   agent.store_id,
      outlet_id:  agent.outlet_id,
    };

    next();
  } catch {
    const err: AppError = Object.assign(new Error("Authentication failed"), { statusCode: 500 });
    next(err);
  }
};
