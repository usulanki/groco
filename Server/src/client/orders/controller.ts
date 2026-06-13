import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
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
  const order = await service.createOrder(req.user?.id ?? "");
  sendSuccess(res, order, "Order created", 201);
});
