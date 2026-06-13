import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await service.getCategories();
  sendSuccess(res, categories);
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.getCategoryBySlug(req.params["slug"] as string);
  sendSuccess(res, category);
});
