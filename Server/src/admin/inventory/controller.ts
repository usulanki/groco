import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { InventoryItemType } from "./types";

function parseInventoryFilters(req: Request) {
  return {
    search:       req.query["search"]    as string | undefined,
    outlet_id:    req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined,
    item_type:    req.query["item_type"]  as InventoryItemType | undefined,
    low_stock:    req.query["low_stock"]    === "true",
    no_inventory: req.query["no_inventory"] === "true",
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const sort_by    = req.query["sort_by"]    as string | undefined;
  const sort_order = req.query["sort_order"] as string | undefined;
  const { search, outlet_id, item_type, low_stock, no_inventory } = parseInventoryFilters(req);

  const result = await service.listInventory(req.admin!.store_id, {
    page,
    limit,
    ...(search       && { search }),
    ...(outlet_id    && { outlet_id }),
    ...(item_type    && { item_type }),
    ...(low_stock    && { low_stock }),
    ...(no_inventory && { no_inventory }),
    ...(sort_by      && { sort_by: sort_by as any }),
    ...(sort_order   && { sort_order: sort_order as any }),
  });
  sendSuccess(res, result);
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const { search, outlet_id, item_type, low_stock, no_inventory } = parseInventoryFilters(req);

  const rows = await service.listAllInventory(req.admin!.store_id, {
    ...(search       && { search }),
    ...(outlet_id    && { outlet_id }),
    ...(item_type    && { item_type }),
    ...(low_stock    && { low_stock }),
    ...(no_inventory && { no_inventory }),
  });

  sendSuccess(res, rows);
});
