import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { GrnSortBy, GrnSortOrder } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit      = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search     = req.query["search"]    as string | undefined;
  const vendor_id  = req.query["vendor_id"] ? Number(req.query["vendor_id"]) : undefined;
  const sort_by    = req.query["sort_by"]    as GrnSortBy    | undefined;
  const sort_order = req.query["sort_order"] as GrnSortOrder | undefined;

  let is_partial: boolean | undefined;
  if (req.query["is_partial"] === "true")  is_partial = true;
  if (req.query["is_partial"] === "false") is_partial = false;

  const outlet_id = req.admin!.role_code !== "ADMIN"
    ? req.admin!.outlet_id
    : req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined;

  const result = await service.listGrns(req.admin!.store_id, {
    page,
    limit,
    ...(search     && { search }),
    ...(is_partial !== undefined && { is_partial }),
    ...(vendor_id  && { vendor_id }),
    ...(sort_by    && { sort_by }),
    ...(sort_order && { sort_order }),
    ...(outlet_id != null && { outlet_id }),
  });
  sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const grn = await service.getGrn(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, grn);
});
