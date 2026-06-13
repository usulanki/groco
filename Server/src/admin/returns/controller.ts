import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { ReturnType, ReturnSortBy, ReturnSortOrder } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit      = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search     = req.query["search"]     as string    | undefined;
  const type       = req.query["type"]       as ReturnType | undefined;
  const sort_by    = req.query["sort_by"]    as ReturnSortBy    | undefined;
  const sort_order = req.query["sort_order"] as ReturnSortOrder | undefined;

  const result = await service.listReturns(req.admin!.store_id, {
    page,
    limit,
    ...(search     && { search }),
    ...(type       && { type }),
    ...(sort_by    && { sort_by }),
    ...(sort_order && { sort_order }),
  });
  sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const id  = parseInt(req.params["id"]);
  const ret = await service.getReturn(id, req.admin!.store_id);
  sendSuccess(res, ret);
});

export const getGrnForReturn = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params["code"];
  const result = await service.getGrnForReturn(code, req.admin!.store_id);
  sendSuccess(res, result);
});

export const createPurchaseReturn = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.createPurchaseReturn(
    req.admin!.store_id!,
    req.admin!.id,
    req.body
  );
  sendSuccess(res, result);
});
