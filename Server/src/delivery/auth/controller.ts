import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (!login?.trim() || !password?.trim()) {
    throw Object.assign(new Error("login and password are required"), { statusCode: 400 });
  }

  const result = await service.login({ login: login.trim(), password: password.trim() });
  sendSuccess(res, result, "Logged in successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body as { refresh_token?: string };

  if (!refresh_token?.trim()) {
    throw Object.assign(new Error("refresh_token is required"), { statusCode: 400 });
  }

  const result = await service.refresh(refresh_token.trim());
  sendSuccess(res, result, "Token refreshed");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  await service.logout();
  sendSuccess(res, null, "Logged out successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const agent = await service.getMe(req.deliveryAgent!.id);
  sendSuccess(res, agent);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    throw Object.assign(new Error("email is required"), { statusCode: 400 });
  }

  await service.forgotPassword({ email: email.trim().toLowerCase() });
  // Always respond the same way to prevent email enumeration
  sendSuccess(res, null, "If that email is registered, a reset link has been sent");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const agent = req.deliveryAgent!;
  const { current_password, new_password } = req.body as { current_password?: string; new_password?: string };

  if (!current_password?.trim() || !new_password?.trim()) {
    throw Object.assign(new Error("current_password and new_password are required"), { statusCode: 400 });
  }
  if (new_password.length < 8) {
    throw Object.assign(new Error("New password must be at least 8 characters"), { statusCode: 400 });
  }

  await service.changePassword(agent.id, current_password.trim(), new_password);
  sendSuccess(res, null, "Password changed successfully");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token?.trim() || !password?.trim()) {
    throw Object.assign(new Error("token and password are required"), { statusCode: 400 });
  }

  if (password.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters"), { statusCode: 400 });
  }

  await service.resetPassword({ token: token.trim(), password });
  sendSuccess(res, null, "Password reset successfully");
});
