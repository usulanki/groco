import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import { registerSchema, loginSchema, googleLoginSchema, facebookLoginSchema, appleLoginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from "./types";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const tokens = await service.register(data);
  sendSuccess(res, tokens, "Registered successfully", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const tokens = await service.login(data);
  sendSuccess(res, tokens, "Logged in successfully");
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = googleLoginSchema.parse(req.body);
  const tokens = await service.googleLogin(data);
  sendSuccess(res, tokens, "Logged in successfully");
});

export const facebookLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = facebookLoginSchema.parse(req.body);
  const tokens = await service.facebookLogin(data);
  sendSuccess(res, tokens, "Logged in successfully");
});

export const appleLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = appleLoginSchema.parse(req.body);
  const tokens = await service.appleLogin(data);
  sendSuccess(res, tokens, "Logged in successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = forgotPasswordSchema.parse(req.body);
  await service.forgotPassword(data);
  sendSuccess(res, null, "If that email exists, a reset code has been sent");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = resetPasswordSchema.parse(req.body);
  await service.resetPassword(data);
  sendSuccess(res, null, "Password updated successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.getMe(parseInt(req.user!.id));
  sendSuccess(res, user, "User fetched");
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await service.updateProfile(parseInt(req.user!.id), data);
  sendSuccess(res, user, "Profile updated");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const data = changePasswordSchema.parse(req.body);
  await service.changePassword(parseInt(req.user!.id), data);
  sendSuccess(res, null, "Password changed successfully");
});
