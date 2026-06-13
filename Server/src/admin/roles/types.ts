import { z } from "zod";

export const RESERVED_ROLE_CODES = new Set(["SUPERADMIN", "ADMIN", "MANAGER"]);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be at most 50 characters")
    .regex(/^[A-Za-z0-9 -]+$/, "Role name may only contain letters, numbers, spaces, and hyphens"),
  status: z.boolean().optional(),
});

export interface CreateRoleDto {
  name: string;
  code: string;
  store_id?: number;
  status?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  code?: string;
  store_id?: number;
}

export interface ChangeStatusDto {
  status: boolean;
}
