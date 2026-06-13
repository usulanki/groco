import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page      = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit     = Math.max(1, parseInt(req.query["limit"] as string) || 100);
  const outlet_id = req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined;
  const rawParent = req.query["parent_id"] as string | undefined;
  const parent_id = rawParent === "null" ? null : rawParent !== undefined ? Number(rawParent) : undefined;
  const result    = await service.listCategories(page, limit, req.admin!.store_id, outlet_id, parent_id);
  sendSuccess(res, result);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const outlet_id = req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined;
  const categories = await service.getAllCategories(req.admin!.store_id, outlet_id);
  sendSuccess(res, categories);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.getCategoryById(Number(req.params["id"]));
  sendSuccess(res, category);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (req.admin!.store_id !== null) data.store_id = req.admin!.store_id;
  const category = await service.createCategory(data);
  sendSuccess(res, category, "Category created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.updateCategory(Number(req.params["id"]), req.body);
  sendSuccess(res, category, "Category updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteCategory(Number(req.params["id"]), req.admin!.id);
  sendSuccess(res, result, "Category deleted");
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.changeCategoryStatus(Number(req.params["id"]));
  sendSuccess(res, result, "Category status updated");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.restoreCategory(Number(req.params["id"]));
  sendSuccess(res, result, "Category restored successfully");
});
