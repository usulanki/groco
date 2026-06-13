import bcrypt from "bcryptjs";
import { Op, type WhereOptions } from "sequelize";
import { Admin, Role, Store, Outlet } from "../../models/index";
import type { CreateAdminDto, UpdateAdminDto } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

// ── Profile (self) ────────────────────────────────────────────────────────────

export const getAdminMe = async (id: number) => {
  const admin = await Admin.findOne({
    where: { id, is_deleted: false },
    include: [
      { model: Role,   attributes: ["id", "name", "code"] },
      { model: Store,  as: "store",          attributes: ["id", "name"], required: false },
      { model: Outlet, as: "managedOutlets", attributes: ["id", "name"], required: false },
    ],
    attributes: { exclude: ["password"] },
  });
  if (!admin) throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;
  return admin.toJSON();
};

export const updateAdminMe = async (id: number, data: { fname?: string; lname?: string; email?: string; phone?: string }) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: false } });
  if (!admin) throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;

  const current = admin.toJSON() as unknown as Record<string, unknown>;

  if (data.email && data.email !== current.email) {
    const taken = await Admin.findOne({ where: { email: data.email, is_deleted: false } });
    if (taken) throw Object.assign(new Error("Email is already in use"), { statusCode: 409 }) as AppError;
  }

  if (data.phone && data.phone !== current.phone) {
    const taken = await Admin.findOne({ where: { phone: data.phone, is_deleted: false } });
    if (taken) throw Object.assign(new Error("Phone number is already in use"), { statusCode: 409 }) as AppError;
  }

  await admin.update({
    ...(data.fname !== undefined && { fname: data.fname }),
    ...(data.lname !== undefined && { lname: data.lname }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
  });

  const { password: _pw, ...safe } = admin.toJSON() as unknown as Record<string, unknown>;
  return safe;
};

export const changeAdminPassword = async (id: number, data: { current_password: string; new_password: string }) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: false } });
  if (!admin) throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;

  const match = await bcrypt.compare(data.current_password, admin.password);
  if (!match) throw Object.assign(new Error("Current password is incorrect"), { statusCode: 400 }) as AppError;

  const hashed = await bcrypt.hash(data.new_password, 10);
  await admin.update({ password: hashed });
};

export const createAdmin = async (
  data: CreateAdminDto,
  storeId: number | null,
  createdBy: number
) => {
  const emailTaken = await Admin.findOne({ where: { email: data.email, is_deleted: false } });
  if (emailTaken) {
    throw Object.assign(new Error("Email is already in use"), { statusCode: 409 }) as AppError;
  }

  const usernameTaken = await Admin.findOne({ where: { username: data.username, is_deleted: false } });
  if (usernameTaken) {
    throw Object.assign(new Error("Username is already taken"), { statusCode: 409 }) as AppError;
  }

  const phoneTaken = await Admin.findOne({ where: { phone: data.phone, is_deleted: false } });
  if (phoneTaken) {
    throw Object.assign(new Error("Phone number is already in use"), { statusCode: 409 }) as AppError;
  }

  if (storeId !== null) {
    const store = await Store.findByPk(storeId, { attributes: ["max_admin"] });
    if (store && store.max_admin > 0) {
      const count = await Admin.count({ where: { store_id: storeId, is_deleted: false } });
      if (count >= store.max_admin) {
        throw Object.assign(
          new Error(`Admin limit reached. This store allows a maximum of ${store.max_admin} admin(s).`),
          { statusCode: 422 },
        ) as AppError;
      }
    }
  }

  const hashed = await bcrypt.hash(data.password, 10);

  const admin = await Admin.create({
    fname:      data.fname,
    lname:      data.lname,
    email:      data.email,
    username:   data.username,
    password:   hashed,
    role_id:    data.role_id,
    store_id:   storeId,
    created_by: createdBy,
    phone:      data.phone,
  });

  const { password: _pw, ...safe } = admin.toJSON() as unknown as Record<string, unknown>;
  return safe;
};

export interface ListAdminsFilters {
  page?: number;
  limit?: number;
  role_id?: number;
  outlet_id?: number;
  store_id?: number;
  sortField?: "fname" | "created_ts";
  sortDir?: "asc" | "desc";
}

function buildScope(roleCode: string, requestingAdminId: number, storeId: number | null, filters: ListAdminsFilters): WhereOptions[] {
  const conditions: WhereOptions[] = [{ is_deleted: false }];

  if (roleCode === "SUPERADMIN") {
    // sees all admins across all stores — no store or creator restriction
  } else if (roleCode === "ADMIN") {
    // sees all admins in their store
    conditions.push({ store_id: storeId });
  } else {
    // MANAGER: only admins they created within their store
    conditions.push({ store_id: storeId }, { created_by: requestingAdminId });
  }

  if (filters.role_id)  conditions.push({ role_id:  filters.role_id  });
  if (filters.store_id) conditions.push({ store_id: filters.store_id });
  return conditions;
}

export const listAdmins = async (
  requestingAdminId: number,
  requestingRoleId: number,
  storeId: number | null,
  filters: ListAdminsFilters = {}
) => {
  const role = await Role.findByPk(requestingRoleId, { attributes: ["code"] });
  const roleCode = role?.code ?? "";

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, filters.limit ?? 20);
  const offset = (page - 1) * limit;
  const sortField = filters.sortField ?? "created_ts";
  const sortDir = (filters.sortDir?.toUpperCase() ?? "DESC") as "ASC" | "DESC";

  const conditions = buildScope(roleCode, requestingAdminId, storeId, filters);

  const { rows, count } = await Admin.findAndCountAll({
    where: { [Op.and]: conditions },
    include: [
      { model: Role, attributes: ["id", "name", "code"] },
      {
        model: Outlet,
        as: "managedOutlets",
        attributes: ["id", "name"],
        required: !!filters.outlet_id,
        ...(filters.outlet_id ? { where: { id: filters.outlet_id } } : {}),
      },
    ],
    attributes: { exclude: ["password"] },
    order: [[sortField, sortDir]],
    limit,
    offset,
    distinct: true,
  });

  return { rows: rows.map((a) => a.toJSON()), count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllAdmins = async (
  requestingAdminId: number,
  requestingRoleId: number,
  storeId: number | null,
) => {
  const role = await Role.findByPk(requestingRoleId, { attributes: ["code"] });
  const roleCode = role?.code ?? "";
  const conditions = buildScope(roleCode, requestingAdminId, storeId, {});

  const admins = await Admin.findAll({
    where: { [Op.and]: conditions },
    attributes: ["id", "fname", "lname", "username"],
    order: [["fname", "ASC"]],
  });

  return admins.map((a) => a.toJSON());
};

// ── Permission guard helper ────────────────────────────────────────────────────

async function assertCanModify(
  target: InstanceType<typeof Admin>,
  requestingAdminId: number,
  requestingRoleId: number,
): Promise<void> {
  const targetRole = await Role.findByPk(target.role_id, { attributes: ["code"] });
  if (targetRole?.code === "ADMIN") {
    throw Object.assign(new Error("Cannot modify an ADMIN account"), { statusCode: 403 }) as AppError;
  }

  const requestingRole = await Role.findByPk(requestingRoleId, { attributes: ["code"] });
  const isAdmin = requestingRole?.code === "ADMIN";
  if (!isAdmin && target.created_by !== requestingAdminId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 }) as AppError;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteAdmin = async (
  id: number,
  requestingAdminId: number,
  requestingRoleId: number,
  storeId: number | null,
) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: false, store_id: storeId } });
  if (!admin) {
    throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;
  }

  await assertCanModify(admin, requestingAdminId, requestingRoleId);
  await admin.update({ is_deleted: true });
  return { id };
};

// ── Restore ───────────────────────────────────────────────────────────────────

export const restoreAdmin = async (id: number, storeId: number | null) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: true, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!admin) throw Object.assign(new Error("Admin not found in trash"), { statusCode: 404 });
  await admin.update({ is_deleted: false });
  const { password: _pw, ...safe } = admin.toJSON() as unknown as Record<string, unknown>;
  return safe;
};

// ── Change Status ─────────────────────────────────────────────────────────────

export const changeAdminStatus = async (
  id: number,
  requestingAdminId: number,
  requestingRoleId: number,
  storeId: number | null,
) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: false, store_id: storeId } });
  if (!admin) {
    throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;
  }

  await assertCanModify(admin, requestingAdminId, requestingRoleId);
  const newStatus = !(admin.toJSON() as unknown as Record<string, unknown>).is_active;
  await admin.update({ is_active: newStatus });
  const { password: _pw, ...safe } = admin.toJSON() as unknown as Record<string, unknown>;
  return safe;
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateAdmin = async (
  id: number,
  data: UpdateAdminDto,
  requestingAdminId: number,
  requestingRoleId: number,
  storeId: number | null,
) => {
  const admin = await Admin.findOne({ where: { id, is_deleted: false, store_id: storeId } });
  if (!admin) {
    throw Object.assign(new Error("Admin not found"), { statusCode: 404 }) as AppError;
  }

  await assertCanModify(admin, requestingAdminId, requestingRoleId);

  const current = admin.toJSON() as unknown as Record<string, unknown>;

  if (data.email && data.email !== current.email) {
    const taken = await Admin.findOne({ where: { email: data.email, is_deleted: false } });
    if (taken) throw Object.assign(new Error("Email is already in use"), { statusCode: 409 }) as AppError;
  }

  if (data.username && data.username !== current.username) {
    const taken = await Admin.findOne({ where: { username: data.username, is_deleted: false } });
    if (taken) throw Object.assign(new Error("Username is already taken"), { statusCode: 409 }) as AppError;
  }

  if (data.phone && data.phone !== current.phone) {
    const taken = await Admin.findOne({ where: { phone: data.phone, is_deleted: false } });
    if (taken) throw Object.assign(new Error("Phone number is already in use"), { statusCode: 409 }) as AppError;
  }

  await admin.update({
    ...(data.fname    !== undefined && { fname:    data.fname    }),
    ...(data.lname    !== undefined && { lname:    data.lname    }),
    ...(data.email    !== undefined && { email:    data.email    }),
    ...(data.username !== undefined && { username: data.username }),
    ...(data.phone    !== undefined && { phone:    data.phone    }),
    ...(data.role_id  !== undefined && { role_id:  data.role_id  }),
  });

  if (data.outlet_id !== undefined) {
    // Clear any outlet currently managed by this admin
    await Outlet.update({ manager_id: null }, { where: { manager_id: admin.id } });
    // Assign the new outlet if provided
    if (data.outlet_id !== null) {
      await Outlet.update({ manager_id: admin.id }, { where: { id: data.outlet_id } });
    }
  }

  const { password: _pw, ...safe } = admin.toJSON() as unknown as Record<string, unknown>;
  return safe;
};
