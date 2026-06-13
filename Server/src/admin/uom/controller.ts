import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 100);
  const result = await service.listUoms(page, limit, req.admin!.store_id);
  sendSuccess(res, result);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const uoms = await service.getAllUoms(req.admin!.store_id);
  sendSuccess(res, uoms);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const uom = await service.createUom({ ...req.body, store_id, created_by: req.admin!.id });
  sendSuccess(res, uom, "UOM created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const uom = await service.updateUom(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, uom, "UOM updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteUom(Number(req.params["id"]), req.admin!.store_id, req.admin!.id);
  sendSuccess(res, null, "UOM deleted");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const uom = await service.restoreUom(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, uom, "UOM restored successfully");
});
