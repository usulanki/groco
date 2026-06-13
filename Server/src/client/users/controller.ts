import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.getProfile(req.user?.id ?? "");
  sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.updateProfile(req.user?.id ?? "", req.body);
  sendSuccess(res, profile);
});
