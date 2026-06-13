import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit  = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search = req.query["search"] as string | undefined;
  const statusParam = req.query["status"] as string | undefined;
  const status = statusParam !== undefined ? statusParam === "1" : undefined;

  const result = await service.listMaterials(page, limit, req.admin!.store_id, search, status);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const material = await service.createMaterial({ ...req.body, store_id, created_by: req.admin!.id });
  sendSuccess(res, material, "Material created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const material = await service.updateMaterial(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, material, "Material updated");
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const material = await service.toggleStatus(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, material, "Material status updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteMaterial(Number(req.params["id"]), req.admin!.store_id, req.admin!.id);
  sendSuccess(res, null, "Material deleted");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const material = await service.restoreMaterial(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, material, "Material restored successfully");
});
