import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { AppError } from "../../shared/middleware/error.middleware";

export const getByRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(req.query["role_id"] as string);
  if (!roleId || isNaN(roleId)) {
    const err = Object.assign(new Error("role_id query parameter is required"), { statusCode: 400 });
    throw err;
  }
  const permissions = await service.getPermissionsByRole(roleId, req.admin!.store_id, req.admin!.role_id);
  sendSuccess(res, permissions);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const permission = await service.updatePermission(
    Number(req.params["id"]),
    req.body,
    req.admin!.store_id
  );
  sendSuccess(res, permission, "Permission updated");
});

export const bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    throw Object.assign(new Error("updates must be an array"), { statusCode: 400 }) as AppError;
  }
  const result = await service.bulkUpdatePermissions(updates, req.admin!.store_id);
  sendSuccess(res, result, "Permissions updated");
});
