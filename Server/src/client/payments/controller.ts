import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const createIntent = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const { addressId } = req.body;
  const result = await service.createPaymentIntent(userId, { addressId });
  sendSuccess(res, result, "Payment intent created");
});

export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const { orderId, stripePaymentIntentId } = req.body;

  if (!orderId || !stripePaymentIntentId) {
    return sendError(res, "orderId and stripePaymentIntentId are required", 400);
  }

  const result = await service.confirmPayment(userId, { orderId: Number(orderId), stripePaymentIntentId });
  sendSuccess(res, result, "Payment confirmed");
});

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const result = await service.createRazorpayOrder(userId, { addressId: req.body.addressId });
  sendSuccess(res, result, "Razorpay order created");
});

export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.user!.id);
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return sendError(res, "Missing required fields", 400);
  }

  const result = await service.verifyRazorpayPayment(userId, {
    orderId: Number(orderId),
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  });
  sendSuccess(res, result, "Payment verified");
});
