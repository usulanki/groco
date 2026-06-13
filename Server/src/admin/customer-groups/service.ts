import { Op } from "sequelize";
import CustomerGroup from "../../models/customerGroup.model";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateCustomerGroupDto, UpdateCustomerGroupDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Customer group not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listCustomerGroups = async (page: number, limit: number, store_id: number | null) => {
  const { rows, count } = await CustomerGroup.findAndCountAll({
    where: { is_deleted: false, ...storeScope(store_id) },
    limit,
    offset: (page - 1) * limit,
    order: [["name", "ASC"]],
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllCustomerGroups = async (store_id: number | null) => {
  return CustomerGroup.findAll({
    where: { is_deleted: false, status: true, ...storeScope(store_id) },
    order: [["name", "ASC"]],
  });
};

export const createCustomerGroup = async (data: CreateCustomerGroupDto) => {
  const code = data.code.toUpperCase().replace(/\s+/g, "_");
  const existing = await CustomerGroup.findOne({ where: { code, is_deleted: false } });
  if (existing) {
    throw Object.assign(new Error("A customer group with this code already exists"), { statusCode: 409 });
  }
  return CustomerGroup.create({ ...data, code });
};

export const updateCustomerGroup = async (id: number, data: UpdateCustomerGroupDto, store_id: number | null) => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const group = await CustomerGroup.findOne({ where });
  if (!group) throw notFoundError();
  return group.update(data);
};

export const deleteCustomerGroup = async (id: number, store_id: number | null): Promise<void> => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const group = await CustomerGroup.findOne({ where });
  if (!group) throw notFoundError();
  await group.update({ is_deleted: true });
};
