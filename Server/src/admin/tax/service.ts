import { Tax, Product } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateTaxDto, UpdateTaxDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Tax not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listTaxes = async (page: number, limit: number, store_id: number | null) => {
  const { rows, count } = await Tax.findAndCountAll({
    where: { is_deleted: false, ...storeScope(store_id) },
    limit,
    offset: (page - 1) * limit,
    order: [["id", "ASC"]],
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllTaxes = async (store_id: number | null) => {
  return Tax.findAll({
    where: { is_deleted: false, status: true, ...storeScope(store_id) },
    order: [["name", "ASC"]],
  });
};

export const createTax = async (data: CreateTaxDto) => {
  return Tax.create(data);
};

export const updateTax = async (id: number, data: UpdateTaxDto, store_id: number | null) => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const tax = await Tax.findOne({ where });
  if (!tax) throw notFoundError();
  if (data.status === false) {
    await Product.update({ tax_id: null }, { where: { tax_id: id } });
  }
  return tax.update(data);
};

export const deleteTax = async (id: number, store_id: number | null, deletedBy: number): Promise<void> => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const tax = await Tax.findOne({ where });
  if (!tax) throw notFoundError();
  await Product.update({ tax_id: null }, { where: { tax_id: id } });
  await tax.update({ is_deleted: true, deleted_by: deletedBy });
};

export const restoreTax = async (id: number, store_id: number | null) => {
  const where = { id, is_deleted: true, ...storeScope(store_id) };
  const tax = await Tax.findOne({ where });
  if (!tax) throw notFoundError();
  return tax.update({ is_deleted: false });
};
