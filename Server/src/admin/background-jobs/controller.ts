import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(String(req.query.page  ?? 1)));
  const limit  = Math.min(100, parseInt(String(req.query.limit ?? 20)));
  const type   = typeof req.query.type   === "string" ? req.query.type   : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  // Superadmin sees all; store admins only their own jobs
  const adminId = req.admin!.role_code === "SUPERADMIN" ? null : req.admin!.id;

  const result = await service.listJobs({
    page,
    limit,
    ...(type   && { type   }),
    ...(status && { status }),
    adminId,
    storeId: req.admin!.store_id,
  });

  sendSuccess(res, result);
});
