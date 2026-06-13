import { Op } from "sequelize";
import { Store, Admin } from "../../models/index";

export async function listStores() {
  const stores = await Store.findAll({
    where: { is_deleted: false },
    attributes: ["id", "name", "status"],
    order: [["name", "ASC"]],
  });
  return stores.map(s => ({ id: s.id, name: s.name, status: s.status }));
}

export async function listStoresDetailed() {
  const stores = await Store.findAll({
    where: { is_deleted: false },
    attributes: ["id", "name", "status", "max_admin", "max_role", "created_ts"],
    order: [["name", "ASC"]],
  });
  const result = await Promise.all(
    stores.map(async (s) => {
      const admin_count = await Admin.count({ where: { store_id: s.id, is_deleted: false } });
      return { ...(s.toJSON() as object), admin_count };
    }),
  );
  return result;
}

export async function createStore(
  data: { name: string; max_admin?: number; max_role?: number },
  adminId: number,
) {
  const existing = await Store.findOne({ where: { name: data.name, is_deleted: false } });
  if (existing) {
    throw Object.assign(new Error("A store with this name already exists"), { statusCode: 409 });
  }
  const store = await Store.create({
    name: data.name,
    max_admin: data.max_admin ?? 0,
    max_role:  data.max_role  ?? 0,
    created_by: adminId,
    status: true,
  });
  return store.toJSON();
}

export async function updateStore(
  id: number,
  data: { name?: string; max_admin?: number; max_role?: number },
) {
  const store = await Store.findOne({ where: { id, is_deleted: false } });
  if (!store) throw Object.assign(new Error("Store not found"), { statusCode: 404 });
  if (data.name && data.name !== store.name) {
    const dup = await Store.findOne({ where: { name: data.name, is_deleted: false, id: { [Op.ne]: id } } });
    if (dup) throw Object.assign(new Error("A store with this name already exists"), { statusCode: 409 });
  }
  await store.update({
    ...(data.name      !== undefined && { name:      data.name      }),
    ...(data.max_admin !== undefined && { max_admin: data.max_admin }),
    ...(data.max_role  !== undefined && { max_role:  data.max_role  }),
  });
  return store.toJSON();
}

export async function deleteStore(id: number) {
  const store = await Store.findOne({ where: { id, is_deleted: false } });
  if (!store) throw Object.assign(new Error("Store not found"), { statusCode: 404 });
  await store.update({ is_deleted: true });
  return { id };
}

export async function toggleStoreStatus(id: number) {
  const store = await Store.findOne({ where: { id, is_deleted: false } });
  if (!store) throw Object.assign(new Error("Store not found"), { statusCode: 404 });
  await store.update({ status: !store.status });
  return store.toJSON();
}

export async function getStore(storeId: number) {
  const store = await Store.findOne({
    where: { id: storeId, is_deleted: false },
    include: [
      {
        model: Admin,
        as: "owner",
        attributes: ["id", "fname", "lname", "email", "phone"],
        required: false,
      },
    ],
  });

  if (!store) return null;

  const total_admins = await Admin.count({
    where: { store_id: storeId, is_deleted: false, is_active: true },
  });

  const owner = (store as any).owner;

  return {
    id: store.id,
    name: store.name,
    gst_number: null as string | null,
    status: store.status,
    created_ts: store.created_ts,
    total_admins,
    owner: owner
      ? {
          id: owner.id,
          fname: owner.fname,
          lname: owner.lname,
          email: owner.email,
          phone: owner.phone ?? null,
        }
      : null,
  };
}
