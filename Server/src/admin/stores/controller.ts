import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (req.admin!.role_code !== "SUPERADMIN") {
    sendError(res, "Forbidden", 403);
    return false;
  }
  return true;
}

export const listStores = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const stores = await service.listStores();
  sendSuccess(res, { stores });
});

export const listDetailed = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const stores = await service.listStoresDetailed();
  sendSuccess(res, { stores });
});

export const createStore = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const store = await service.createStore(req.body, req.admin!.id);
  sendSuccess(res, store, "Store created successfully", 201);
});

export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const store = await service.updateStore(Number(req.params["id"]), req.body);
  sendSuccess(res, store, "Store updated successfully");
});

export const deleteStore = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const result = await service.deleteStore(Number(req.params["id"]));
  sendSuccess(res, result, "Store deleted successfully");
});

export const toggleStoreStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const store = await service.toggleStoreStatus(Number(req.params["id"]));
  sendSuccess(res, store, "Store status updated");
});

export const getStore = asyncHandler(async (req: Request, res: Response) => {
  const storeId = Number(req.params.id);
  const adminStoreId = req.admin!.store_id;

  // Only allow access to the store the admin belongs to
  if (adminStoreId === null || adminStoreId !== storeId) {
    return sendError(res, "Forbidden", 403);
  }

  const store = await service.getStore(storeId);
  if (!store) return sendError(res, "Store not found", 404);

  sendSuccess(res, store);
});
