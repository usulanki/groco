import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { PrState, ItemType, SortBy, SortOrder } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page          = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit         = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search        = req.query["search"]        as string | undefined;
  const pr_state      = req.query["pr_state"]      as PrState | undefined;
  const item_type     = req.query["item_type"]     as ItemType | undefined;
  const sort_by       = req.query["sort_by"]       as SortBy | undefined;
  const sort_order    = req.query["sort_order"]    as SortOrder | undefined;
  const vendor_id     = req.query["vendor_id"]     ? Number(req.query["vendor_id"])     : undefined;
  const category_id   = req.query["category_id"]   ? Number(req.query["category_id"])   : undefined;
  const subcategory_id = req.query["subcategory_id"] ? Number(req.query["subcategory_id"]) : undefined;
  const outlet_id = req.admin!.role_code !== "ADMIN"
    ? req.admin!.outlet_id
    : req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined;
  const result = await service.listPurchases(req.admin!.store_id, {
    page, limit, search, pr_state, item_type,
    vendor_id, category_id, subcategory_id, sort_by, sort_order,
    outlet_id,
  });
  sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await service.getPurchase(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, purchase);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) throw Object.assign(new Error("Account not assigned to a store."), { statusCode: 400 });
  const outlet_id = req.admin!.role_code === "ADMIN" ? (req.body.outlet_id ?? null) : (req.admin!.outlet_id ?? null);
  const purchase = await service.createPurchase({ ...req.body, store_id, outlet_id, created_by: req.admin!.id });
  sendSuccess(res, purchase, "Purchase created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await service.updatePurchase(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, purchase, "Purchase updated");
});

export const grn = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.createGrn(
    Number(req.params["id"]),
    req.admin!.store_id,
    { item_ids: req.body.item_ids, grn_by: req.admin!.id, outlet_id: req.body.outlet_id ?? null },
  );
  sendSuccess(res, result, "GRN created");
});
