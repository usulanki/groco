import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await service.getWishlist(req.user?.id ?? "");
  sendSuccess(res, wishlist);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await service.addToWishlist(req.user?.id ?? "", req.body.productId);
  sendSuccess(res, wishlist, "Added to wishlist");
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await service.removeFromWishlist(req.user?.id ?? "", req.params["productId"] as string);
  sendSuccess(res, wishlist, "Removed from wishlist");
});
