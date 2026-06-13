import type { Request, Response, NextFunction } from "express";
import { Menu, Permission } from "../../models/index";
import type { AppError } from "./error.middleware";

type PermissionField = "view" | "add" | "edit" | "delete" | "upload" | "download";

const methodToField: Record<string, PermissionField> = {
  GET: "view",
  POST: "add",
  PUT: "edit",
  PATCH: "edit",
  DELETE: "delete",
};

export const checkPermission = (menuLink: string, field?: PermissionField) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // SUPERADMIN bypasses all permission checks
      if (req.admin!.role_code === "SUPERADMIN") return next();

      const menu = await Menu.findOne({ where: { link: menuLink } });
      if (!menu) {
        const err: AppError = Object.assign(new Error("Menu not configured"), { statusCode: 403 });
        return next(err);
      }

      const { role_id, store_id } = req.admin!;
      const resolvedField = field ?? (methodToField[req.method.toUpperCase()] ?? "view");

      const permission = await Permission.findOne({
        where: { menu_id: menu.id, role_id, store_id: store_id ?? null },
      });

      if (!permission || !permission[resolvedField]) {
        const err: AppError = Object.assign(new Error("Access denied"), { statusCode: 403 });
        return next(err);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
