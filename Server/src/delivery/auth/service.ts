import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import DeliveryAgent from "../../models/deliveryAgent.model";
import { env } from "../../config/env";
import { sendMail } from "../../shared/utils/mailer";
import type { DeliveryLoginDto, DeliveryForgotPasswordDto, DeliveryResetPasswordDto, DeliveryAuthTokens, DeliveryAgentPayload } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

const buildPayload = (agent: DeliveryAgent): DeliveryAgentPayload => ({
  id:         agent.id,
  first_name: agent.first_name,
  last_name:  agent.last_name,
  email:      agent.email,
  mobile:     agent.mobile,
  store_id:   agent.store_id,
  outlet_id:  agent.outlet_id,
  type:       "delivery",
});

export const login = async (data: DeliveryLoginDto): Promise<DeliveryAuthTokens> => {
  const agent = await DeliveryAgent.findOne({
    where: {
      [Op.or]: [{ email: data.login }, { mobile: data.login }],
      is_deleted: false,
    },
  });

  if (!agent || !agent.password) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 }) as AppError;
  }

  const isMatch = await bcrypt.compare(data.password, agent.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 }) as AppError;
  }

  if (!agent.status) {
    throw Object.assign(
      new Error("Your account has been deactivated. Please contact support."),
      { statusCode: 403 }
    ) as AppError;
  }

  const payload      = buildPayload(agent);
  const accessToken  = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "7d" });
  const refreshToken = jwt.sign({ id: agent.id, type: "delivery" }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

  return { agent: payload, accessToken, refreshToken };
};

export const refresh = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload: { id: number; type: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: number; type: string };
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 }) as AppError;
  }

  if (payload.type !== "delivery") {
    throw Object.assign(new Error("Invalid token type"), { statusCode: 401 }) as AppError;
  }

  const agent = await DeliveryAgent.findOne({ where: { id: payload.id, is_deleted: false, status: true } });
  if (!agent) {
    throw Object.assign(new Error("Account not found or deactivated"), { statusCode: 401 }) as AppError;
  }

  const accessToken    = jwt.sign(buildPayload(agent), env.JWT_ACCESS_SECRET,  { expiresIn: "7d"  });
  const newRefreshToken = jwt.sign({ id: agent.id, type: "delivery" }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (): Promise<void> => {
  // JWT is stateless — client discards both tokens on logout
};

export const getMe = async (id: number): Promise<DeliveryAgentPayload> => {
  const agent = await DeliveryAgent.findOne({ where: { id, is_deleted: false } });
  if (!agent) {
    throw Object.assign(new Error("Agent not found"), { statusCode: 404 }) as AppError;
  }
  return buildPayload(agent);
};

export const forgotPassword = async (data: DeliveryForgotPasswordDto): Promise<void> => {
  const agent = await DeliveryAgent.findOne({ where: { email: data.email, is_deleted: false } });
  // Don't reveal whether the email exists — always return 200
  if (!agent?.email) return;

  // Short-lived JWT used as a one-time reset token (15 min)
  const resetToken = jwt.sign(
    { id: agent.id, purpose: "delivery-password-reset" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  await sendMail(
    agent.email,
    "Groco Delivery — Password Reset",
    `<p>Hi ${agent.first_name},</p>
     <p>We received a request to reset your delivery partner account password.</p>
     <p>Use this code in the app to reset your password:</p>
     <h2 style="letter-spacing:4px;background:#ffcc01;display:inline-block;padding:8px 16px;border-radius:8px">${resetToken}</h2>
     <p>This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>`
  );
};

export const changePassword = async (agentId: number, currentPassword: string, newPassword: string): Promise<void> => {
  const agent = await DeliveryAgent.findOne({ where: { id: agentId, is_deleted: false } });
  if (!agent || !agent.password) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 }) as AppError;
  }
  const isMatch = await bcrypt.compare(currentPassword, agent.password);
  if (!isMatch) {
    throw Object.assign(new Error("Current password is incorrect"), { statusCode: 401 }) as AppError;
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await agent.update({ password: hashed });
};

export const resetPassword = async (data: DeliveryResetPasswordDto): Promise<void> => {
  let payload: { id: number; purpose: string };
  try {
    payload = jwt.verify(data.token, env.JWT_ACCESS_SECRET) as { id: number; purpose: string };
  } catch {
    throw Object.assign(new Error("Invalid or expired reset token"), { statusCode: 400 }) as AppError;
  }

  if (payload.purpose !== "delivery-password-reset") {
    throw Object.assign(new Error("Invalid token"), { statusCode: 400 }) as AppError;
  }

  const agent = await DeliveryAgent.findOne({ where: { id: payload.id, is_deleted: false } });
  if (!agent) {
    throw Object.assign(new Error("Agent not found"), { statusCode: 404 }) as AppError;
  }

  const hashed = await bcrypt.hash(data.password, 10);
  await agent.update({ password: hashed });
};
