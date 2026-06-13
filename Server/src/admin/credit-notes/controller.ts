import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const outlet_id = req.query["outlet_id"] ? Number(req.query["outlet_id"]) : undefined;
  const result = await service.listCreditNotes(req.admin!.store_id, {
    page:      parseInt(req.query["page"]  as string) || 1,
    limit:     parseInt(req.query["limit"] as string) || 20,
    search:    req.query["search"] as string | undefined,
    outlet_id: outlet_id ?? null,
  });
  sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const cn = await service.getCreditNote(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, cn);
});

export const getByReturnId = asyncHandler(async (req: Request, res: Response) => {
  const cn = await service.getCreditNoteByReturnId(Number(req.params["returnId"]), req.admin!.store_id);
  sendSuccess(res, cn);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null)
    throw Object.assign(new Error("Account not assigned to a store."), { statusCode: 400 });

  const result = await service.createCreditNote(store_id, req.admin!.id, {
    return_id:     req.body.return_id,
    outlet_id:     req.body.outlet_id ?? null,
    grn_code:      req.body.grn_code,
    purchase_code: req.body.purchase_code,
  });

  sendSuccess(res, result, "Credit note created", 201);
});
