import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const activeOrders = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const lat   = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng   = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  if ((lat != null && isNaN(lat)) || (lng != null && isNaN(lng))) {
    throw Object.assign(new Error("lat and lng must be valid numbers"), { statusCode: 400 });
  }

  const orders = await service.getActiveOrders(agent.store_id, agent.outlet_id, lat, lng);
  sendSuccess(res, orders);
});

export const accept = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw Object.assign(new Error("Invalid order ID"), { statusCode: 400 });
  const result = await service.acceptOrder(id);
  sendSuccess(res, result, "Order accepted");
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw Object.assign(new Error("Invalid order ID"), { statusCode: 400 });
  const order = await service.getOrderDetail(id);
  sendSuccess(res, order);
});

export const deliver = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw Object.assign(new Error("Invalid order ID"), { statusCode: 400 });
  await service.deliverOrder(id);
  sendSuccess(res, null, "Order marked as delivered");
});

export const deliveredOrders = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const { from, to } = req.query;

  const parseDay = (s: string, endOfDay: boolean) => {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    endOfDay ? d.setHours(23, 59, 59, 999) : d.setHours(0, 0, 0, 0);
    return d;
  };

  const fromStr = typeof from === 'string' ? from : undefined;
  const toStr   = typeof to   === 'string' ? to   : undefined;

  const now = new Date();
  const fromDate = fromStr
    ? parseDay(fromStr, false)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const toDate = toStr
    ? parseDay(toStr, true)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (!fromDate || !toDate) {
    throw Object.assign(new Error("Invalid date format. Use YYYY-MM-DD"), { statusCode: 400 });
  }

  const orders = await service.getDeliveredOrders(agent.store_id, agent.outlet_id, fromDate, toDate);
  sendSuccess(res, orders);
});
