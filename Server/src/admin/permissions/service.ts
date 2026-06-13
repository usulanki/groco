import { Op, literal } from "sequelize";
import { Permission, Menu, Role } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { UpdatePermissionDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Permission not found"), { statusCode: 404 });

const accessDeniedError = (): AppError =>
  Object.assign(new Error("Access denied"), { statusCode: 403 });

export const getPermissionsByRole = async (
  roleId: number,
  storeId: number | null,
  callerRoleId: number,
) => {
  // Resolve the caller's role code — menus are shown based on who is logged in
  const callerRole = await Role.findByPk(callerRoleId, { attributes: ["code"] });
  if (!callerRole) {
    throw Object.assign(new Error("Caller role not found"), { statusCode: 403 }) as AppError;
  }
  const callerCode = callerRole.toJSON().code as string;

  // Verify the target role exists
  const targetRole = await Role.findByPk(roleId, { attributes: ["id"] });
  if (!targetRole) {
    throw Object.assign(new Error("Role not found"), { statusCode: 404 }) as AppError;
  }

  // Fetch all top-level menus whose scope includes the *caller's* role code
  const menus = await Menu.findAll({
    where: {
      parent_id: null,
      status: true,
      [Op.and]: [literal(`FIND_IN_SET('${callerCode.replace(/'/g, "''")}', scope) > 0`)],
    },
    attributes: ["id", "name", "link", "icon", "sort_order"],
    order: [["sort_order", "ASC"]],
  });

  if (!menus.length) {
    throw Object.assign(
      new Error("No menus are accessible for your role"),
      { statusCode: 404 }
    ) as AppError;
  }

  // Ensure a permission row exists for every matching menu (auto-create with all false)
  const results = await Promise.all(
    menus.map(async (menu) => {
      const [permission] = await Permission.findOrCreate({
        where: { menu_id: menu.id, role_id: roleId, store_id: storeId },
        defaults: { menu_id: menu.id, role_id: roleId, store_id: storeId },
      });
      const pJson = permission.toJSON() as unknown as Record<string, unknown>;
      const mJson = menu.toJSON() as unknown as Record<string, unknown>;
      return { ...pJson, Menu: mJson };
    })
  );

  return results.sort((a, b) => {
    const sortA = (a.Menu as Record<string, unknown>).sort_order as number ?? 0;
    const sortB = (b.Menu as Record<string, unknown>).sort_order as number ?? 0;
    return sortA - sortB;
  });
};

export const updatePermission = async (
  id: number,
  data: UpdatePermissionDto,
  storeId: number | null
) => {
  const permission = await Permission.findByPk(id);
  if (!permission) throw notFoundError();
  if (permission.store_id !== storeId) throw accessDeniedError();
  return permission.update(data);
};

export const bulkUpdatePermissions = async (
  updates: Array<{ id: number } & UpdatePermissionDto>,
  storeId: number | null
) => {
  return Promise.all(updates.map(({ id, ...data }) => updatePermission(id, data, storeId)));
};
