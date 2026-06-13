import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await service.getProductReviews(req.params["productId"] as string);
  sendSuccess(res, reviews);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await service.createReview(req.user?.id ?? "", req.body);
  sendSuccess(res, review, "Review created", 201);
});
