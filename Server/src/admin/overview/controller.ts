import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  if (req.admin!.role_code !== "SUPERADMIN") {
    return sendError(res, "Forbidden", 403);
  }
  const data = await service.getOverviewStats();
  sendSuccess(res, data);
});
