import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import { validateDiscountCode } from "../../admin/discounts/service";

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await service.getCart(req.user?.id ?? "");
  sendSuccess(res, cart);
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await service.addToCart(req.user?.id ?? "", req.body);
  sendSuccess(res, cart);
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await service.removeFromCart(req.user?.id ?? "", req.params["productId"] as string);
  sendSuccess(res, cart);
});

export const decrementFromCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await service.decrementFromCart(req.user?.id ?? "", req.params["productId"] as string);
  sendSuccess(res, cart);
});

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const user_id = Number(req.user?.id);
  if (!user_id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  const { code, store_id, order_amount, product_ids, category_ids } = req.body;
  const result = await validateDiscountCode({ code, user_id, store_id, order_amount, product_ids: product_ids ?? [], category_ids: category_ids ?? [] });
  sendSuccess(res, result, "Coupon applied");
});
