import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await service.getSettings(req.admin!.id);
  sendSuccess(res, settings);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as Partial<Record<service.NotificationKey, boolean>>;
  const settings = await service.updateSettings(req.admin!.id, updates);
  sendSuccess(res, settings, "Notification settings updated.");
});
