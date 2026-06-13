import { Op } from "sequelize";
import { Category, Store, Outlet, Product, Media } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateCategoryDto, UpdateCategoryDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Category not found"), { statusCode: 404 });

const includeAssociations = [
  { model: Store, attributes: ["id", "name"] },
  { model: Outlet, attributes: ["id", "name"] },
  { model: Category, as: "parent", attributes: ["id", "name", "slug"] },
  { model: Media, as: "media", attributes: ["id", "path", "filename", "original_name"], required: false },
];

export const listCategories = async (
  page: number,
  limit: number,
  storeId: number | null,
  outlet_id?: number,
  parentId?: number | null,
) => {
  const where: Record<string, unknown> = { is_deleted: false };
  if (storeId !== null) where[Op.or as unknown as string] = [{ store_id: storeId }, { store_id: null }];
  if (outlet_id) where["outlet_id"] = outlet_id;
  if (parentId !== undefined) where["parent_id"] = parentId;

  const { rows, count } = await Category.findAndCountAll({
    where,
    include: [
      ...includeAssociations,
      {
        model: Category, as: "children",
        attributes: ["id", "name", "slug", "status", "is_deleted", "media_id"],
        where: { is_deleted: false }, required: false,
        include: [{ model: Media, as: "media", attributes: ["id", "path", "filename", "original_name"], required: false }],
      },
    ],
    limit,
    offset: (page - 1) * limit,
    order: [["name", "ASC"]],
    distinct: true,
  });

  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getAllCategories = async (storeId: number | null, outlet_id?: number) => {
  const where: Record<string, unknown> = { is_deleted: false };
  if (storeId !== null) where[Op.or as unknown as string] = [{ store_id: storeId }, { store_id: null }];
  if (outlet_id) where["outlet_id"] = outlet_id;

  return Category.findAll({
    where,
    include: [
      ...includeAssociations,
      {
        model: Category, as: "children",
        attributes: ["id", "name", "slug", "status", "is_deleted", "media_id"],
        where: { is_deleted: false }, required: false,
        include: [{ model: Media, as: "media", attributes: ["id", "path", "filename", "original_name"], required: false }],
      },
    ],
    order: [["name", "ASC"]],
  });
};

export const getCategoryById = async (id: number) => {
  const category = await Category.findOne({
    where: { id, is_deleted: false },
    include: [
      ...includeAssociations,
      {
        model: Category, as: "children",
        attributes: ["id", "name", "slug", "status", "is_deleted", "media_id"],
        where: { is_deleted: false }, required: false,
        include: [{ model: Media, as: "media", attributes: ["id", "path", "filename", "original_name"], required: false }],
      },
    ],
  });
  if (!category) throw notFoundError();
  return category;
};

export const createCategory = async (data: CreateCategoryDto) => {
  return Category.create(data);
};

export const updateCategory = async (id: number, data: UpdateCategoryDto) => {
  const category = await Category.findOne({ where: { id, is_deleted: false } });
  if (!category) throw notFoundError();
  return category.update(data);
};

export const deleteCategory = async (id: number, deletedBy: number) => {
  const category = await Category.findOne({ where: { id, is_deleted: false } });
  if (!category) throw notFoundError();
  await category.update({ is_deleted: true, deleted_by: deletedBy });

  // Cascade: soft-delete subcategories and all their products
  const subs = await Category.findAll({ where: { parent_id: id, is_deleted: false }, attributes: ["id"] });
  const subIds = subs.map(s => s.id);
  if (subIds.length > 0) {
    await Category.update({ is_deleted: true, deleted_by: deletedBy }, { where: { id: subIds } });
  }
  await Product.update({ is_deleted: true, deleted_by: deletedBy }, { where: { category_id: [id, ...subIds] } });

  return { id };
};

export const restoreCategory = async (id: number) => {
  const category = await Category.findOne({ where: { id, is_deleted: true } });
  if (!category) throw notFoundError();
  await category.update({ is_deleted: false });
  return category.toJSON();
};

export const changeCategoryStatus = async (id: number) => {
  const category = await Category.findOne({ where: { id, is_deleted: false } });
  if (!category) throw notFoundError();
  const newStatus = !category.status;
  await category.update({ status: newStatus });

  // Cascade: update subcategories and all their products
  const subs = await Category.findAll({ where: { parent_id: id, is_deleted: false }, attributes: ["id"] });
  const subIds = subs.map(s => s.id);
  if (subIds.length > 0) {
    await Category.update({ status: newStatus }, { where: { id: subIds } });
  }
  await Product.update({ status: newStatus }, { where: { category_id: [id, ...subIds] } });

  return category;
};
