import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import { createVendorSchema, updateVendorSchema } from "./types";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page   = parseInt(req.query["page"]  as string) || 1;
  const limit  = parseInt(req.query["limit"] as string) || 20;
  const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
  const statusRaw = req.query["status"];
  const status = statusRaw === "true" ? true : statusRaw === "false" ? false : undefined;

  const result = await service.listVendors(req.admin!.store_id, { page, limit, search, status });
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vendor = await service.getVendorById(id, req.admin!.store_id);
  sendSuccess(res, vendor);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createVendorSchema.parse(req.body);
  const vendor = await service.createVendor(req.admin!.store_id, data);
  sendSuccess(res, vendor, "Vendor created successfully", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = updateVendorSchema.parse(req.body);
  const vendor = await service.updateVendor(id, req.admin!.store_id, data);
  sendSuccess(res, vendor, "Vendor updated successfully");
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vendor = await service.toggleVendorStatus(id, req.admin!.store_id);
  sendSuccess(res, vendor, "Vendor status updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await service.deleteVendor(id, req.admin!.store_id, req.admin!.id);
  sendSuccess(res, { id }, "Vendor deleted successfully");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await service.restoreVendor(Number(req.params.id), req.admin!.store_id);
  sendSuccess(res, vendor, "Vendor restored successfully");
});
