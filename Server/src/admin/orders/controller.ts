import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import type { OrderStatus } from "./types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page         = Math.max(1, parseInt(req.query["page"] as string) || 1);
  const limit        = Math.max(1, Math.min(10000, parseInt(req.query["limit"] as string) || 20));
  const rawStatus    = req.query["order_status"];
  const order_status = Array.isArray(rawStatus)
    ? (rawStatus as string[]).filter(Boolean) as OrderStatus[]
    : rawStatus ? [rawStatus as OrderStatus] : undefined;
  const search       = (req.query["search"] as string | undefined)?.trim() || undefined;
  const customer_id  = req.query["customer_id"] ? parseInt(req.query["customer_id"] as string) : undefined;
  const sort_order   = (req.query["sort_order"] as "ASC" | "DESC" | undefined) ?? "DESC";
  const date_from    = (req.query["date_from"] as string | undefined) || undefined;
  const date_to      = (req.query["date_to"]   as string | undefined) || undefined;

  const result = await service.listOrders({
    page,
    limit,
    sort_order,
    ...(order_status?.length && { order_status }),
    ...(search       && { search }),
    ...(customer_id  && { customer_id }),
    ...(date_from    && { date_from }),
    ...(date_to      && { date_to }),
  });
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await service.getOrderById(Number(req.params["id"]));
  sendSuccess(res, order);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.createOrder(req.body, {
    store_id:  req.admin?.store_id  ?? null,
    outlet_id: req.admin?.outlet_id ?? null,
    id:    req.admin?.id,
    fname: req.admin?.fname,
    lname: req.admin?.lname,
  });
  sendSuccess(res, result, "Order created", 201);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteOrder(Number(req.params["id"]));
  sendSuccess(res, null, "Order deleted");
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.admin ? { id: req.admin.id, fname: req.admin.fname, lname: req.admin.lname } : null;
  const order = await service.changeOrderStatus(Number(req.params["id"]), req.body.order_status, actor);
  sendSuccess(res, order, "Order status updated");
});

export const transferOutlet = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.admin ? { id: req.admin.id, fname: req.admin.fname, lname: req.admin.lname } : null;
  const order = await service.transferOrderOutlet(Number(req.params["id"]), Number(req.body.outlet_id), actor);
  sendSuccess(res, order, "Order transferred successfully");
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await service.getOrderHistory(Number(req.params["id"]));
  sendSuccess(res, history);
});
