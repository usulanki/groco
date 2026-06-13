import { Op, literal, type WhereOptions } from "sequelize";
import { Role, Admin, Store, Menu, Permission } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateRoleDto, UpdateRoleDto } from "./types";
import { RESERVED_ROLE_CODES } from "./types";

const systemRoleError = (): AppError =>
  Object.assign(new Error("System roles cannot be modified or deleted"), { statusCode: 403 });

const notFoundError = (): AppError =>
  Object.assign(new Error("Role not found"), { statusCode: 404 });

const accessDeniedError = (): AppError =>
  Object.assign(new Error("Access denied"), { statusCode: 403 });

const reservedRoleError = (): AppError =>
  Object.assign(new Error("This role name is reserved and cannot be used"), { statusCode: 400 });

const duplicateRoleError = (name: string): AppError =>
  Object.assign(new Error(`A role named "${name}" already exists`), { statusCode: 409 });

/**
 * Builds a raw SQL fragment for store_id scoping.
 * Uses literal() to guarantee IS NULL — Sequelize serialises plain null inside
 * Op.or as "= NULL" which is always false in MySQL.
 *
 *   storeId = null  →  store_id IS NULL
 *   storeId = N     →  store_id IS NULL OR store_id = N
 */
function storeScope(storeId: number | null): WhereOptions {
  const sql = storeId !== null
    ? `(\`Role\`.\`store_id\` IS NULL OR \`Role\`.\`store_id\` = ${storeId})`
    : `(\`Role\`.\`store_id\` IS NULL)`;
  return { [Op.and]: [literal(sql)] } as WhereOptions;
}

/**
 * Role list scope:
 *   SUPERADMIN  → if queryStoreId provided: global + that store; else all roles
 *   ADMIN       → global roles + their own store's roles
 *   others      → 403
 */
async function buildListScope(
  callerRoleId: number,
  callerStoreId: number | null,
  queryStoreId: number | null,
): Promise<WhereOptions> {
  const callerRole = await Role.findByPk(callerRoleId, { attributes: ["code"] });
  if (!callerRole) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  if (callerRole.code === "SUPERADMIN") {
    return queryStoreId !== null ? storeScope(queryStoreId) : {};
  }

  if (callerRole.code === "ADMIN") {
    const sql = callerStoreId !== null
      ? `(\`Role\`.\`store_id\` IS NULL OR \`Role\`.\`store_id\` = ${callerStoreId})`
      : `(\`Role\`.\`store_id\` IS NULL)`;
    return {
      [Op.and]: [literal(sql)],
      code: { [Op.ne]: "SUPERADMIN" },
    } as WhereOptions;
  }

  throw Object.assign(new Error("Access denied"), { statusCode: 403 });
}

/**
 * Write-op scope (update / delete / status change):
 *   SUPERADMIN  → all roles
 *   ADMIN       → global + their store
 *   MANAGER     → only their own created roles
 */
async function buildCallerScope(
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
): Promise<WhereOptions> {
  const callerRole = await Role.findByPk(callerRoleId, { attributes: ["code"] });
  if (!callerRole) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  if (callerRole.code === "SUPERADMIN") return {};
  if (callerRole.code === "ADMIN") return storeScope(storeId);

  return { created_by: callerAdminId };
}

export const listRoles = async (
  page: number,
  limit: number,
  callerRoleId: number,
  callerStoreId: number | null,
  queryStoreId: number | null,
) => {
  const scope = await buildListScope(callerRoleId, callerStoreId, queryStoreId);
  const offset = (page - 1) * limit;
  const { rows, count } = await Role.findAndCountAll({
    where: { is_deleted: false, ...scope },
    include: [
      { model: Store, as: "store", attributes: ["id", "name"] },
      { model: Admin, as: "creator", attributes: ["id", "username"] },
    ],
    limit,
    offset,
    order: [["id", "ASC"]],
    distinct: true,
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllRoles = async (
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
  includeInactive = false,
  forPermissions = false,
) => {
  const [scope, callerRole] = await Promise.all([
    buildCallerScope(callerRoleId, callerAdminId, storeId),
    Role.findByPk(callerRoleId, { attributes: ["code"] }),
  ]);
  const isAdmin = callerRole?.code === "ADMIN";
  const excludedCodes = isAdmin
    ? (forPermissions ? ["SUPERADMIN", "ADMIN"] : ["SUPERADMIN"])
    : [];
  const extraWhere: WhereOptions = excludedCodes.length
    ? { code: { [Op.notIn]: excludedCodes } }
    : {};
  const statusWhere: WhereOptions = includeInactive ? {} : { status: true };
  return Role.findAll({
    where: { is_deleted: false, ...statusWhere, ...scope, ...extraWhere },
    attributes: ["id", "name", "status"],
    order: [["name", "ASC"]],
  });
};

export const createRole = async (data: CreateRoleDto, adminId: number) => {
  if (RESERVED_ROLE_CODES.has(data.code)) throw reservedRoleError();

  // Uniqueness: check same code within the same store scope
  const where = data.store_id != null
    ? { code: data.code, store_id: data.store_id, is_deleted: false }
    : { code: data.code, is_deleted: false };
  const existing = await Role.findOne({ where });
  if (existing) throw duplicateRoleError(data.name);

  if (data.store_id != null) {
    const store = await Store.findByPk(data.store_id, { attributes: ["max_role"] });
    if (store && store.max_role > 0) {
      const count = await Role.count({ where: { store_id: data.store_id, is_deleted: false, created_by: { [Op.ne]: null } } });
      if (count >= store.max_role) {
        throw Object.assign(
          new Error(`Role limit reached. This store allows a maximum of ${store.max_role} role(s).`),
          { statusCode: 422 },
        ) as AppError;
      }
    }
  }

  const role = await Role.create({ ...data, created_by: adminId });

  // Auto-grant full dashboard permission for the new role
  const dashboard = await Menu.findOne({ where: { link: "/dashboard", parent_id: null } });
  if (dashboard) {
    await Permission.findOrCreate({
      where: { menu_id: dashboard.id, role_id: role.id, store_id: data.store_id ?? null },
      defaults: {
        menu_id: dashboard.id,
        role_id: role.id,
        store_id: data.store_id ?? null,
        view: true, add: true, edit: true, delete: true, upload: true, download: true,
      },
    });
  }

  return role;
};

export const updateRole = async (
  id: number,
  data: UpdateRoleDto,
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
) => {
  const role = await Role.findByPk(id);
  if (!role) throw notFoundError();
  if (role.created_by === null) throw systemRoleError();

  const scope = await buildCallerScope(callerRoleId, callerAdminId, storeId);
  const allowed = await Role.findOne({ where: { id, ...scope } });
  if (!allowed) throw accessDeniedError();

  return role.update(data);
};

export const deleteRole = async (
  id: number,
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
) => {
  const role = await Role.findByPk(id);
  if (!role) throw notFoundError();
  if (role.created_by === null) throw systemRoleError();

  const scope = await buildCallerScope(callerRoleId, callerAdminId, storeId);
  const allowed = await Role.findOne({ where: { id, ...scope } });
  if (!allowed) throw accessDeniedError();

  return role.update({ is_deleted: true });
};

export const restoreRole = async (
  id: number,
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
) => {
  const role = await Role.findOne({ where: { id, is_deleted: true } });
  if (!role) throw notFoundError();
  if (role.created_by === null) throw systemRoleError();

  const scope = await buildCallerScope(callerRoleId, callerAdminId, storeId);
  const allowed = await Role.findOne({ where: { id, ...scope } });
  if (!allowed) throw accessDeniedError();

  return role.update({ is_deleted: false });
};

export const changeRoleStatus = async (
  id: number,
  status: boolean,
  callerRoleId: number,
  callerAdminId: number,
  storeId: number | null,
) => {
  const role = await Role.findByPk(id);
  if (!role) throw notFoundError();
  if (role.created_by === null) throw systemRoleError();

  const scope = await buildCallerScope(callerRoleId, callerAdminId, storeId);
  const allowed = await Role.findOne({ where: { id, ...scope } });
  if (!allowed) throw accessDeniedError();

  return role.update({ status });
};
