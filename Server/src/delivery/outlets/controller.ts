import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const nearby = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const lat   = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng   = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  const outlets = await service.getNearbyOutlets(
    agent.store_id,
    agent.outlet_id,
    lat,
    lng,
  );

  sendSuccess(res, outlets);
});
