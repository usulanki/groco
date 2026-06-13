import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getTrash = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getTrashData(req.admin!.store_id);
  sendSuccess(res, data);
});
