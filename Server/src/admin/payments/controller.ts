import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { PaymentType, PaymentSortBy, PaymentSortOrder, CreateVendorPaymentDto } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit      = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search     = req.query["search"]     as string            | undefined;
  const type       = req.query["type"]       as PaymentType       | undefined;
  const sort_by    = req.query["sort_by"]    as PaymentSortBy     | undefined;
  const sort_order = req.query["sort_order"] as PaymentSortOrder  | undefined;
  const vendor_id  = req.query["vendor_id"]  ? parseInt(req.query["vendor_id"] as string) : undefined;

  const result = await service.listPayments(req.admin!.store_id, {
    page, limit,
    ...(search     && { search }),
    ...(type       && { type }),
    ...(vendor_id  && { vendor_id }),
    ...(sort_by    && { sort_by }),
    ...(sort_order && { sort_order }),
  });
  sendSuccess(res, result);
});

export const vendorCreditNotes = asyncHandler(async (req: Request, res: Response) => {
  const vendor_id = parseInt(req.query["vendor_id"] as string);
  if (!vendor_id) {
    res.status(400).json({ success: false, message: "vendor_id is required" });
    return;
  }
  const rows = await service.listVendorCreditNotes(req.admin!.store_id, vendor_id);
  sendSuccess(res, rows);
});

export const vendorData = asyncHandler(async (req: Request, res: Response) => {
  const vendor_id = parseInt(req.query["vendor_id"] as string);
  if (!vendor_id) {
    res.status(400).json({ success: false, message: "vendor_id is required" });
    return;
  }
  const data = await service.getVendorData(req.admin!.store_id, vendor_id);
  sendSuccess(res, data);
});

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const admin    = req.admin!;
  const store_id = admin.store_id;
  if (!store_id) {
    res.status(403).json({ success: false, message: "Store context required" });
    return;
  }

  const dto: CreateVendorPaymentDto = req.body;
  const result = await service.createVendorPayment(store_id, admin.id, dto);
  res.status(201).json({ success: true, data: result });
});
