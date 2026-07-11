import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await service.getOrders(req.user?.id ?? "");
  sendSuccess(res, orders);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await service.getOrderById(req.user?.id ?? "", req.params["id"] as string);
  sendSuccess(res, order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId    = String(req.user!.id);
  const items     = req.body.items;
  const addressId = req.body.address_id != null ? Number(req.body.address_id) : undefined;
  const latitude  = req.body.latitude   != null ? Number(req.body.latitude)   : undefined;
  const longitude = req.body.longitude  != null ? Number(req.body.longitude)  : undefined;

  if (!Array.isArray(items) || items.length === 0)
    return sendError(res, "items array is required", 400);

  const orders = await service.createOrder(userId, items, addressId, latitude, longitude);
  sendSuccess(res, orders, "Order placed", 201);
});
