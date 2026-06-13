import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";
import { createAdminSchema, updateAdminSchema } from "./types";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = await service.getAdminMe(req.admin!.id);
  sendSuccess(res, admin);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone } = req.body as { email?: string; phone?: string };
  const result = await service.updateAdminMe(req.admin!.id, { email, phone });
  sendSuccess(res, result, "Profile updated successfully");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body as { current_password: string; new_password: string };
  if (!current_password || !new_password) {
    return sendError(res, "current_password and new_password are required", 400);
  }
  await service.changeAdminPassword(req.admin!.id, { current_password, new_password });
  sendSuccess(res, null, "Password changed successfully");
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createAdminSchema.parse({
    ...req.body,
    role_id: Number(req.body.role_id),
  });
  const storeId =
    req.admin!.role_code === "SUPERADMIN" && req.body.store_id != null
      ? Number(req.body.store_id)
      : req.admin!.store_id;
  const admin = await service.createAdmin(data, storeId, req.admin!.id);
  sendSuccess(res, admin, "Admin created successfully", 201);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const admins = await service.getAllAdmins(req.admin!.id, req.admin!.role_id, req.admin!.store_id);
  sendSuccess(res, admins);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page      = Math.max(1, parseInt(req.query["page"]      as string) || 1);
  const limit     = Math.max(1, parseInt(req.query["limit"]     as string) || 20);
  const rawRoleId   = typeof req.query.role_id   === "string" ? parseInt(req.query.role_id,   10) : NaN;
  const rawOutletId = typeof req.query.outlet_id === "string" ? parseInt(req.query.outlet_id, 10) : NaN;
  const rawSort     = typeof req.query.sortField === "string" ? req.query.sortField : "created_ts";
  const rawDir      = typeof req.query.sortDir   === "string" ? req.query.sortDir   : "desc";

  const filters: service.ListAdminsFilters = {
    page,
    limit,
    sortField: (["fname", "created_ts"] as const).includes(rawSort as "fname") ? rawSort as "fname" | "created_ts" : "created_ts",
    sortDir:   rawDir === "asc" ? "asc" : "desc",
  };
  if (!isNaN(rawRoleId))   filters.role_id   = rawRoleId;
  if (!isNaN(rawOutletId)) filters.outlet_id = rawOutletId;
  const rawStoreId = typeof req.query["store_id"] === "string" ? parseInt(req.query["store_id"], 10) : NaN;
  if (!isNaN(rawStoreId)) filters.store_id = rawStoreId;

  const result = await service.listAdmins(req.admin!.id, req.admin!.role_id, req.admin!.store_id, filters);
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await service.deleteAdmin(id, req.admin!.id, req.admin!.role_id, req.admin!.store_id);
  sendSuccess(res, result, "Admin deleted successfully");
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await service.changeAdminStatus(id, req.admin!.id, req.admin!.role_id, req.admin!.store_id);
  sendSuccess(res, result, "Admin status updated successfully");
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = updateAdminSchema.parse({
    ...req.body,
    ...(req.body.role_id   !== undefined && { role_id:   Number(req.body.role_id) }),
    ...(req.body.outlet_id !== undefined && { outlet_id: req.body.outlet_id === null ? null : Number(req.body.outlet_id) }),
  });
  const result = await service.updateAdmin(id, data, req.admin!.id, req.admin!.role_id, req.admin!.store_id);
  sendSuccess(res, result, "Admin updated successfully");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.restoreAdmin(Number(req.params.id), req.admin!.store_id);
  sendSuccess(res, result, "Admin restored successfully");
});
