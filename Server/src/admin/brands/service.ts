import { Op } from "sequelize";
import Brand from "../../models/brand.model";
import Media from "../../models/media.model";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateBrandDto, UpdateBrandDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Brand not found"), { statusCode: 404 });

export const listBrands = async (page: number, limit: number, store_id: number | null) => {
  // Always include global brands; if store_id is set, also include that store's custom brands
  const where: Record<string, unknown> =
    store_id !== null
      ? { is_deleted: false, [Op.or]: [{ type: "global" }, { store_id }] }
      : { is_deleted: false };

  const { rows, count } = await Brand.findAndCountAll({
    where,
    include: [{ model: Media, as: "media", attributes: ["id", "path", "filename", "original_name"] }],
    limit,
    offset: (page - 1) * limit,
    order: [
      ["type", "ASC"],
      ["name", "ASC"],
    ],
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const createBrand = async (data: CreateBrandDto) => {
  const existing = await Brand.findOne({
    where: { name: data.name, is_deleted: false },
  });
  if (existing) {
    throw Object.assign(new Error("A brand with this name already exists."), {
      statusCode: 409,
    }) as AppError;
  }
  return Brand.create(data);
};

export const updateBrand = async (
  id: number,
  data: UpdateBrandDto,
  store_id: number | null,
) => {
  const brand = await Brand.findOne({ where: { id, is_deleted: false } });
  if (!brand) throw notFoundError();

  // Non-superadmins cannot edit global brands
  if (store_id !== null && brand.type === "global") {
    throw Object.assign(new Error("Global brands can only be edited by a Super Admin."), {
      statusCode: 403,
    }) as AppError;
  }

  if (data.name && data.name !== brand.name) {
    const existing = await Brand.findOne({ where: { name: data.name, is_deleted: false } });
    if (existing) {
      throw Object.assign(new Error("A brand with this name already exists."), {
        statusCode: 409,
      }) as AppError;
    }
  }

  return brand.update(data);
};

export const deleteBrand = async (
  id: number,
  store_id: number | null,
  deletedBy: number,
): Promise<void> => {
  const brand = await Brand.findOne({ where: { id, is_deleted: false } });
  if (!brand) throw notFoundError();

  if (store_id !== null && brand.type === "global") {
    throw Object.assign(new Error("Global brands can only be deleted by a Super Admin."), {
      statusCode: 403,
    }) as AppError;
  }

  await brand.update({ is_deleted: true, deleted_by: deletedBy });
};

export const toggleBrandStatus = async (id: number, store_id: number | null) => {
  const brand = await Brand.findOne({ where: { id, is_deleted: false } });
  if (!brand) throw notFoundError();

  if (store_id !== null && brand.type === "global") {
    throw Object.assign(new Error("Global brand status can only be changed by a Super Admin."), {
      statusCode: 403,
    }) as AppError;
  }

  return brand.update({ status: !brand.status });
};
