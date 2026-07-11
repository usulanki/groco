import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const data = await service.getWalletSummary(agent.id, agent.store_id, agent.outlet_id);
  sendSuccess(res, data);
});

export const requestPayout = asyncHandler(async (req: Request, res: Response) => {
  const agent  = req.deliveryAgent!;
  const amount = Number(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return sendError(res, "amount must be a positive number", 400);
  }
  const payout = await service.requestPayout(agent.id, amount);
  sendSuccess(res, payout, "Payout request submitted");
});

export const payouts = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const data  = await service.listPayouts(agent.id);
  sendSuccess(res, data);
});
