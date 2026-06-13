import { Uom } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateUomDto, UpdateUomDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("UOM not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listUoms = async (page: number, limit: number, store_id: number | null) => {
  const { rows, count } = await Uom.findAndCountAll({
    where: { is_deleted: false, ...storeScope(store_id) },
    limit,
    offset: (page - 1) * limit,
    order: [["name", "ASC"]],
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllUoms = async (store_id: number | null) => {
  return Uom.findAll({
    where: { is_deleted: false, status: true, ...storeScope(store_id) },
    order: [["name", "ASC"]],
  });
};

export const createUom = async (data: CreateUomDto) => {
  const existing = await Uom.findOne({
    where: { name: data.name, store_id: data.store_id, is_deleted: false },
  });
  if (existing) {
    throw Object.assign(new Error("A UOM with this name already exists."), { statusCode: 409 }) as AppError;
  }
  return Uom.create(data);
};

export const updateUom = async (id: number, data: UpdateUomDto, store_id: number | null) => {
  const uom = await Uom.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!uom) throw notFoundError();

  if (data.name && data.name !== uom.name) {
    const existing = await Uom.findOne({
      where: { name: data.name, store_id: uom.store_id, is_deleted: false },
    });
    if (existing) {
      throw Object.assign(new Error("A UOM with this name already exists."), { statusCode: 409 }) as AppError;
    }
  }

  return uom.update(data);
};

export const deleteUom = async (id: number, store_id: number | null, deletedBy: number): Promise<void> => {
  const uom = await Uom.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!uom) throw notFoundError();
  await uom.update({ is_deleted: true, deleted_by: deletedBy });
};

export const restoreUom = async (id: number, store_id: number | null) => {
  const uom = await Uom.findOne({ where: { id, is_deleted: true, ...storeScope(store_id) } });
  if (!uom) throw notFoundError();
  return uom.update({ is_deleted: false });
};
