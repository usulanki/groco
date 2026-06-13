import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { TransactionType, TransactionSortBy, TransactionSortOrder } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page       = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit      = Math.max(1, parseInt(req.query["limit"] as string) || 20);
  const search     = req.query["search"]     as string              | undefined;
  const type       = req.query["type"]       as TransactionType     | undefined;
  const sort_by    = req.query["sort_by"]    as TransactionSortBy   | undefined;
  const sort_order = req.query["sort_order"] as TransactionSortOrder | undefined;

  const result = await service.listTransactions(req.admin!.store_id, {
    page,
    limit,
    ...(search     && { search }),
    ...(type       && { type }),
    ...(sort_by    && { sort_by }),
    ...(sort_order && { sort_order }),
  });
  sendSuccess(res, result);
});
