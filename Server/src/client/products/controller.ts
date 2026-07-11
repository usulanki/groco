import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await service.getProducts(req.query, req.outletIds);
  sendSuccess(res, products);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductById(req.params["id"] as string);
  sendSuccess(res, product);
});
