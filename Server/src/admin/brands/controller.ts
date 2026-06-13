import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 500);
  const result = await service.listBrands(page, limit, req.admin!.store_id);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.createBrand({
    ...req.body,
    store_id:   req.body.type === "global" ? null : req.admin!.store_id,
    created_by: req.admin!.id,
  });
  sendSuccess(res, brand, "Brand created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.updateBrand(
    Number(req.params["id"]),
    req.body,
    req.admin!.store_id,
  );
  sendSuccess(res, brand, "Brand updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteBrand(
    Number(req.params["id"]),
    req.admin!.store_id,
    req.admin!.id,
  );
  sendSuccess(res, null, "Brand deleted");
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const brand = await service.toggleBrandStatus(
    Number(req.params["id"]),
    req.admin!.store_id,
  );
  sendSuccess(res, brand, "Brand status updated");
});
