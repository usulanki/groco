import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await service.getAllUsers();
  sendSuccess(res, users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.createUser(req.body);
  sendSuccess(res, user, "Customer created", 201);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.getUserById(req.params["id"] as string);
  sendSuccess(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteUser(req.params["id"] as string, req.admin!.id);
  sendSuccess(res, null, "User deleted");
});

export const getUserWishlist = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserWishlist(req.params["id"] as string);
  sendSuccess(res, items);
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserOrders(req.params["id"] as string);
  sendSuccess(res, items);
});

export const getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserAddresses(req.params["id"] as string);
  sendSuccess(res, items);
});

export const createUserAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await service.createUserAddress(req.params["id"] as string, req.body);
  sendSuccess(res, address, "Address created", 201);
});

export const getUserCart = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserCart(req.params["id"] as string);
  sendSuccess(res, items);
});

export const getUserPayments = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserPayments(req.params["id"] as string);
  sendSuccess(res, items);
});

export const getUserDiscountUsages = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getUserDiscountUsages(req.params["id"] as string);
  sendSuccess(res, items);
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  await service.restoreUser(req.params["id"] as string);
  sendSuccess(res, null, "Customer restored successfully");
});
