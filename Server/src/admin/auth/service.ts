import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin, Role, Permission, Menu } from "../../models/index";
import { env } from "../../config/env";
import type { AdminLoginDto, AdminAuthTokens } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

export const adminLogin = async (data: AdminLoginDto & { remember_me?: boolean }): Promise<AdminAuthTokens> => {
  const admin = await Admin.findOne({
    where: {
      [Op.or]: [{ email: data.login }, { username: data.login }],
      is_deleted: false,
      is_active: true,
    },
  });

  const invalidError: AppError = Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  if (!admin) throw invalidError;

  const passwordMatch = await bcrypt.compare(data.password, admin.password);
  if (!passwordMatch) throw invalidError;

  const role = await Role.findOne({ where: { id: admin.role_id, status: true, is_deleted: false } });
  if (!role) throw Object.assign(new Error("Your role has been disabled or removed"), { statusCode: 403 });

  const accessToken = jwt.sign(
    { id: admin.id, username: admin.username, email: admin.email, fname: admin.fname, lname: admin.lname, role_id: admin.role_id, store_id: admin.store_id ?? null, role_code: role.code, outlet_id: admin.outlet_id ?? null },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: admin.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: data.remember_me ? "30d" : "7d" }
  );

  const permissionRecords = await Permission.findAll({
    where: { role_id: admin.role_id, store_id: admin.store_id ?? null },
    include: [
      {
        model: Menu,
        attributes: ["id", "name", "link", "icon", "sort_order", "parent_id", "status", "show_in_sidebar"],
      },
    ],
    order: [[{ model: Menu, as: "Menu" }, "sort_order", "ASC"]],
  });

  const permissions = permissionRecords.map((p) => p.toJSON());

  return { accessToken, refreshToken, permissions };
};

export const adminLogout = async (): Promise<void> => {
  // JWT is stateless — actual invalidation is handled client-side by discarding both tokens.
  // Access token expires in 15 min; refresh token must be cleared by the client.
};

export const refreshAdminToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  let payload: { id: number };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: number };
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 });
  }

  const admin = await Admin.findOne({
    where: { id: payload.id, is_deleted: false, is_active: true },
    include: [{ model: Role, where: { status: true, is_deleted: false }, required: true }],
  });
  if (!admin) throw Object.assign(new Error("Account or role is inactive"), { statusCode: 401 });

  const role = await Role.findOne({ where: { id: admin.role_id, status: true, is_deleted: false } });
  if (!role) throw Object.assign(new Error("Role not found"), { statusCode: 401 });

  const accessToken = jwt.sign(
    { id: admin.id, username: admin.username, email: admin.email, fname: admin.fname, lname: admin.lname, role_id: admin.role_id, store_id: admin.store_id ?? null, role_code: role.code, outlet_id: admin.outlet_id ?? null },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
};
