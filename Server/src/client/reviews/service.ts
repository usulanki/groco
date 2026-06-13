import { Review } from "../../models/index";
import type { CreateReviewDto } from "./types";

export const getProductReviews = async (productId: string) => {
  return Review.findAll({
    where: { product_id: Number(productId) },
    order: [["created_ts", "DESC"]],
  });
};

export const createReview = async (userId: string, data: CreateReviewDto) => {
  return Review.create({
    user_id: Number(userId),
    product_id: Number(data.productId),
    review: data.review,
  });
};
