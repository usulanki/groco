import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

// ── Attributes ────────────────────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const result = await service.listAttributes(page, limit, req.admin!.store_id);
  sendSuccess(res, result);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const attrs = await service.getAllAttributes(req.admin!.store_id);
  sendSuccess(res, attrs);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const attr = await service.createAttribute({ ...req.body, store_id });
  sendSuccess(res, attr, "Variant attribute created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const attr = await service.updateAttribute(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, attr, "Variant attribute updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAttribute(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, null, "Variant attribute deleted");
});

// ── Attribute Values ──────────────────────────────────────────────────────────

export const addValue = asyncHandler(async (req: Request, res: Response) => {
  const val = await service.addAttributeValue(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, val, "Attribute value added", 201);
});

export const updateValue = asyncHandler(async (req: Request, res: Response) => {
  const val = await service.updateAttributeValue(Number(req.params["valueId"]), req.body);
  sendSuccess(res, val, "Attribute value updated");
});

export const removeValue = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAttributeValue(Number(req.params["valueId"]));
  sendSuccess(res, null, "Attribute value deleted");
});
