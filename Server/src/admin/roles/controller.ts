import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import { createRoleSchema } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 100);
  const queryStoreId = req.query["store_id"] ? Number(req.query["store_id"]) : null;
  const result = await service.listRoles(page, limit, req.admin!.role_id, req.admin!.store_id, queryStoreId);
  sendSuccess(res, result);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query["includeInactive"] === "true";
  const forPermissions = req.query["forPermissions"] === "true";
  const roles = await service.getAllRoles(req.admin!.role_id, req.admin!.id, req.admin!.store_id, includeInactive, forPermissions);
  sendSuccess(res, roles);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, status } = createRoleSchema.parse(req.body);
  const code = name.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const dto: import("./types").CreateRoleDto = { name: name.trim(), code };
  const storeId =
    req.admin!.role_code === "SUPERADMIN" && req.body.store_id != null
      ? Number(req.body.store_id)
      : req.admin!.store_id;
  if (storeId != null) dto.store_id = storeId;
  if (status !== undefined) dto.status = status;
  const role = await service.createRole(dto, req.admin!.id);
  sendSuccess(res, role, "Role created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const role = await service.updateRole(
    Number(req.params["id"]),
    req.body,
    req.admin!.role_id,
    req.admin!.id,
    req.admin!.store_id,
  );
  sendSuccess(res, role, "Role updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteRole(Number(req.params["id"]), req.admin!.role_id, req.admin!.id, req.admin!.store_id);
  sendSuccess(res, null, "Role deleted");
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const role = await service.changeRoleStatus(
    Number(req.params["id"]),
    req.body.status,
    req.admin!.role_id,
    req.admin!.id,
    req.admin!.store_id,
  );
  sendSuccess(res, role, "Role status updated");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const role = await service.restoreRole(
    Number(req.params["id"]),
    req.admin!.role_id,
    req.admin!.id,
    req.admin!.store_id,
  );
  sendSuccess(res, role, "Role restored successfully");
});
