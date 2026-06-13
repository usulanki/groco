import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit  = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search = (req.query["search"] as string | undefined)?.trim() || undefined;
  const statusFilter = req.query["status_filter"] as string | undefined;
  const typeFilter   = req.query["type"] as string | undefined;
  const result = await service.listDiscounts(page, limit, req.admin!.store_id, { search, statusFilter, typeFilter });
  sendSuccess(res, result);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getDiscountStats(req.admin!.store_id);
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const discount = await service.getDiscountById(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, discount);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const discount = await service.createDiscount({ ...req.body, store_id });
  sendSuccess(res, discount, "Discount created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const discount = await service.updateDiscount(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, discount, "Discount updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteDiscount(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, null, "Discount deleted");
});
