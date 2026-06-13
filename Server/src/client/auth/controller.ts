import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import { registerSchema, loginSchema, googleLoginSchema, facebookLoginSchema, appleLoginSchema } from "./types";

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
