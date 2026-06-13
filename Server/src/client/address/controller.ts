import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const addresses = await service.getAddresses(userId);
  sendSuccess(res, addresses);
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const { address1, address2, city_id, state_id, pincode } = req.body;

  if (!address1 || !city_id || !state_id || !pincode) {
    return sendError(res, "address1, city_id, state_id, and pincode are required", 400);
  }

  const address = await service.createAddress(userId, {
    address1,
    address2,
    city_id: Number(city_id),
    state_id: Number(state_id),
    pincode,
  });
  sendSuccess(res, address, "Address saved");
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const address = await service.deleteAddress(userId, req.params.id);
  if (!address) return sendError(res, "Address not found", 404);
  sendSuccess(res, null, "Address removed");
});
