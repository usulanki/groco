import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const partners = await service.listDeliveryPartners();
  sendSuccess(res, partners);
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const partner = await service.toggleDeliveryPartnerStatus(id);
  sendSuccess(res, partner, "Status updated");
});

export const getFlag = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.admin!.store_id!;
  const flag = await service.getFeatureFlag(storeId, "delivery_partner");
  sendSuccess(res, flag);
});

export const setFlag = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.admin!.store_id!;
  const enabled = Boolean(req.body.enabled);
  const flag = await service.setFeatureFlag(storeId, "delivery_partner", enabled);
  sendSuccess(res, flag, `Delivery Partners ${enabled ? "enabled" : "disabled"}`);
});
