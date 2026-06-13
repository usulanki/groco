import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const result = await service.listTaxes(page, limit, req.admin!.store_id);
  sendSuccess(res, result);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const taxes = await service.getAllTaxes(req.admin!.store_id);
  sendSuccess(res, taxes);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const tax = await service.createTax({ ...req.body, store_id });
  sendSuccess(res, tax, "Tax created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const tax = await service.updateTax(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, tax, "Tax updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteTax(Number(req.params["id"]), req.admin!.store_id, req.admin!.id);
  sendSuccess(res, null, "Tax deleted");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const tax = await service.restoreTax(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, tax, "Tax restored successfully");
});
