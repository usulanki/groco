import { Op, literal } from "sequelize";
import { Vendor } from "../../models/index";
import type { CreateVendorDto, UpdateVendorDto } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

export interface ListVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}

export const listVendors = async (storeId: number | null, params: ListVendorsParams = {}) => {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { is_deleted: false };
  if (storeId !== null) where["store_id"] = storeId;
  if (params.status !== undefined) where["status"] = params.status;
  if (params.search) {
    where[Op.or as unknown as string] = [
      { company_name: { [Op.like]: `%${params.search}%` } },
      { owner_name:   { [Op.like]: `%${params.search}%` } },
      { owner_phone:  { [Op.like]: `%${params.search}%` } },
    ];
  }

  const { rows, count } = await Vendor.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          literal(`(SELECT MAX(created_ts) FROM purchases WHERE vendor_id = Vendor.id)`),
          "last_purchase_at",
        ],
      ],
    },
    order: [["created_ts", "DESC"]],
    limit,
    offset,
  });

  return { rows: rows.map((v) => v.toJSON()), count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getVendorById = async (id: number, storeId: number | null) => {
  const vendor = await Vendor.findOne({ where: { id, is_deleted: false, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!vendor) throw Object.assign(new Error("Vendor not found"), { statusCode: 404 }) as AppError;
  return vendor.toJSON();
};

export const createVendor = async (storeId: number | null, data: CreateVendorDto) => {
  const vendor = await Vendor.create({
    store_id:      storeId,
    company_name:  data.company_name,
    owner_name:    data.owner_name,
    owner_email:   data.owner_email || null,
    owner_phone:   data.owner_phone,
    owner_address: data.owner_address || null,
    gst_no:        data.gst_no || null,
  });
  return vendor.toJSON();
};

export const updateVendor = async (id: number, storeId: number | null, data: UpdateVendorDto) => {
  const vendor = await Vendor.findOne({ where: { id, is_deleted: false, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!vendor) throw Object.assign(new Error("Vendor not found"), { statusCode: 404 }) as AppError;

  await vendor.update({
    ...(data.company_name  !== undefined && { company_name:  data.company_name }),
    ...(data.owner_name    !== undefined && { owner_name:    data.owner_name }),
    ...(data.owner_email   !== undefined && { owner_email:   data.owner_email || null }),
    ...(data.owner_phone   !== undefined && { owner_phone:   data.owner_phone }),
    ...(data.owner_address !== undefined && { owner_address: data.owner_address || null }),
    ...(data.gst_no        !== undefined && { gst_no:        data.gst_no || null }),
  });
  return vendor.toJSON();
};

export const toggleVendorStatus = async (id: number, storeId: number | null) => {
  const vendor = await Vendor.findOne({ where: { id, is_deleted: false, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!vendor) throw Object.assign(new Error("Vendor not found"), { statusCode: 404 }) as AppError;
  await vendor.update({ status: !vendor.status });
  return vendor.toJSON();
};

export const deleteVendor = async (id: number, storeId: number | null, deletedBy: number) => {
  const vendor = await Vendor.findOne({ where: { id, is_deleted: false, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!vendor) throw Object.assign(new Error("Vendor not found"), { statusCode: 404 }) as AppError;
  await vendor.update({ is_deleted: true, deleted_by: deletedBy });
  return { id };
};

export const restoreVendor = async (id: number, storeId: number | null) => {
  const vendor = await Vendor.findOne({ where: { id, is_deleted: true, ...(storeId !== null ? { store_id: storeId } : {}) } });
  if (!vendor) throw Object.assign(new Error("Vendor not found in trash"), { statusCode: 404 }) as AppError;
  await vendor.update({ is_deleted: false });
  return vendor.toJSON();
};
