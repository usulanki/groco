import { Op } from "sequelize";
import Material from "../../models/material.model";
import Uom from "../../models/uom.model";
import Category from "../../models/category.model";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateMaterialDto, UpdateMaterialDto } from "./types";

const notFound = (): AppError =>
  Object.assign(new Error("Material not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

function randomCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueCode(store_id: number): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const exists = await Material.findOne({ where: { code, store_id, is_deleted: false } });
    if (!exists) return code;
  }
  throw Object.assign(new Error("Failed to generate unique material code."), { statusCode: 500 });
}

export const listMaterials = async (
  page: number,
  limit: number,
  store_id: number | null,
  search?: string,
  status?: boolean
) => {
  const where: Record<string, unknown> = { is_deleted: false, ...storeScope(store_id) };
  if (search) where["name"] = { [Op.like]: `%${search}%` };
  if (status !== undefined) where["status"] = status;

  const { rows, count } = await Material.findAndCountAll({
    where,
    include: [
      { model: Uom,      as: "Uom",         attributes: ["id", "name", "short_name"] },
      { model: Category, as: "Category",    attributes: ["id", "name"] },
      { model: Category, as: "Subcategory", attributes: ["id", "name"] },
    ],
    limit,
    offset: (page - 1) * limit,
    order: [["created_ts", "DESC"]],
  });
  return { rows, count };
};

export const createMaterial = async (data: CreateMaterialDto) => {
  const code = await generateUniqueCode(data.store_id);
  return Material.create({ ...data, code });
};

export const updateMaterial = async (
  id: number,
  data: UpdateMaterialDto,
  store_id: number | null
) => {
  const material = await Material.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!material) throw notFound();

  return material.update(data);
};

export const toggleStatus = async (id: number, store_id: number | null) => {
  const material = await Material.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!material) throw notFound();
  return material.update({ status: !material.status });
};

export const deleteMaterial = async (id: number, store_id: number | null, deletedBy: number): Promise<void> => {
  const material = await Material.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!material) throw notFound();
  await material.update({ is_deleted: true, deleted_by: deletedBy });
};

export const restoreMaterial = async (id: number, store_id: number | null) => {
  const material = await Material.findOne({ where: { id, is_deleted: true, ...storeScope(store_id) } });
  if (!material) throw notFound();
  await material.update({ is_deleted: false });
  return material.toJSON();
};
