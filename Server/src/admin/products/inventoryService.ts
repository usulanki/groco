import { Product, ProductInventory, Outlet, ProductVariant } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFoundError = (entity = "Inventory record"): AppError =>
  Object.assign(new Error(`${entity} not found`), { statusCode: 404 });

export interface CreateInventoryDto {
  outlet_id: number;
  sku: string;
  variant_id?: number;
  saleable_qty?: number;
  non_saleable_qty?: number;
  low_stock_threshold?: number;
}

export interface UpdateInventoryDto {
  sku?: string;
  saleable_qty?: number;
  non_saleable_qty?: number;
  low_stock_threshold?: number;
}

function withTotalQty(record: ProductInventory) {
  return {
    ...record.toJSON(),
    total_qty: record.saleable_qty + record.non_saleable_qty,
  };
}

export const listInventory = async (product_id: number, store_id: number | null) => {
  const where: Record<string, unknown> = { product_id };
  if (store_id !== null) where["store_id"] = store_id;

  const records = await ProductInventory.findAll({
    where,
    include: [
      { model: Outlet, as: "outlet", attributes: ["id", "name"] },
      { model: ProductVariant, as: "variant", attributes: ["id", "sku", "barcode"] },
    ],
    order: [["outlet_id", "ASC"]],
  });
  return records.map(withTotalQty);
};

export const createInventoryRecord = async (product_id: number, data: CreateInventoryDto, store_id: number) => {
  const product = await Product.findOne({ where: { id: product_id, is_deleted: false } });
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });

  if (!product.is_stockable) {
    throw Object.assign(new Error("Inventory cannot be added to a non-stockable product"), { statusCode: 422 });
  }

  const record = await ProductInventory.create({ product_id, store_id, ...data });
  const full = await ProductInventory.findByPk(record.id, {
    include: [
      { model: Outlet, as: "outlet", attributes: ["id", "name"] },
      { model: ProductVariant, as: "variant", attributes: ["id", "sku", "barcode"] },
    ],
  });
  return withTotalQty(full!);
};

export const updateInventoryRecord = async (id: number, product_id: number, data: UpdateInventoryDto) => {
  const record = await ProductInventory.findOne({ where: { id, product_id } });
  if (!record) throw notFoundError();
  await record.update(data);
  return withTotalQty(record);
};

export const deleteInventoryRecord = async (id: number, product_id: number): Promise<void> => {
  const record = await ProductInventory.findOne({ where: { id, product_id } });
  if (!record) throw notFoundError();
  await record.destroy();
};
