import VariantAttribute from "../../models/variantAttribute.model";
import VariantAttributeValue from "../../models/variantAttributeValue.model";
import type { AppError } from "../../shared/middleware/error.middleware";
import type {
  CreateVariantAttributeDto,
  UpdateVariantAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
} from "./types";

const notFoundError = (entity = "Variant attribute"): AppError =>
  Object.assign(new Error(`${entity} not found`), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

// ── Attributes ────────────────────────────────────────────────────────────────

export const listAttributes = async (page: number, limit: number, store_id: number | null) => {
  const { rows, count } = await VariantAttribute.findAndCountAll({
    where: { is_deleted: false, ...storeScope(store_id) },
    include: [{ model: VariantAttributeValue, as: "values", attributes: ["id", "value", "sort_order"] }],
    limit,
    offset: (page - 1) * limit,
    order: [["id", "ASC"]],
    distinct: true,
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllAttributes = async (store_id: number | null) => {
  return VariantAttribute.findAll({
    where: { is_deleted: false, status: true, ...storeScope(store_id) },
    include: [{ model: VariantAttributeValue, as: "values", attributes: ["id", "value", "sort_order"], order: [["sort_order", "ASC"]] }],
    order: [["id", "ASC"]],
  });
};

const duplicateError = (): AppError =>
  Object.assign(new Error("An attribute with this name already exists for your store."), { statusCode: 409 });

export const createAttribute = async (data: CreateVariantAttributeDto) => {
  const { values, ...rest } = data;
  const exists = await VariantAttribute.findOne({ where: { name: rest.name, store_id: rest.store_id, is_deleted: false } });
  if (exists) throw duplicateError();
  const attr = await VariantAttribute.create(rest);
  if (values && values.length > 0) {
    await VariantAttributeValue.bulkCreate(
      values.map((v, i) => ({ attribute_id: attr.id, value: v.value, sort_order: v.sort_order ?? i }))
    );
  }
  return VariantAttribute.findByPk(attr.id, {
    include: [{ model: VariantAttributeValue, as: "values" }],
  });
};

export const updateAttribute = async (id: number, data: UpdateVariantAttributeDto, store_id: number | null) => {
  const attr = await VariantAttribute.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!attr) throw notFoundError();
  if (data.name && data.name !== attr.name) {
    const exists = await VariantAttribute.findOne({ where: { name: data.name, store_id: attr.store_id, is_deleted: false } });
    if (exists) throw duplicateError();
  }
  return attr.update(data);
};

export const deleteAttribute = async (id: number, store_id: number | null): Promise<void> => {
  const attr = await VariantAttribute.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!attr) throw notFoundError();
  await attr.update({ is_deleted: true });
};

// ── Attribute Values ──────────────────────────────────────────────────────────

export const addAttributeValue = async (attribute_id: number, data: CreateAttributeValueDto, store_id: number | null) => {
  const attr = await VariantAttribute.findOne({ where: { id: attribute_id, is_deleted: false, ...storeScope(store_id) } });
  if (!attr) throw notFoundError();
  const count = await VariantAttributeValue.count({ where: { attribute_id } });
  return VariantAttributeValue.create({ attribute_id, value: data.value, sort_order: data.sort_order ?? count });
};

export const updateAttributeValue = async (id: number, data: UpdateAttributeValueDto) => {
  const val = await VariantAttributeValue.findByPk(id);
  if (!val) throw notFoundError("Attribute value");
  return val.update(data);
};

export const deleteAttributeValue = async (id: number): Promise<void> => {
  const val = await VariantAttributeValue.findByPk(id);
  if (!val) throw notFoundError("Attribute value");
  await val.destroy();
};
