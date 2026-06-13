import { Op } from "sequelize";
import { Product, ProductPrice, CustomerGroup, Outlet, ProductVariant } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFoundError = (): AppError =>
  Object.assign(new Error("Price rule not found"), { statusCode: 404 });

export interface CreatePriceDto {
  price: number;
  compare_at_price?: number;
  final_price?: number;
  variant_id?: number;
  customer_group_id?: number;
  outlet_id?: number;
  min_qty?: number;
  max_qty?: number;
  valid_from?: string;
  valid_to?: string;
  priority?: number;
}

export interface UpdatePriceDto {
  price?: number;
  compare_at_price?: number;
  final_price?: number;
  min_qty?: number;
  max_qty?: number;
  valid_from?: string;
  valid_to?: string;
  priority?: number;
  status?: boolean;
}

export const listPrices = async (product_id: number) => {
  return ProductPrice.findAll({
    where: { product_id, is_deleted: false },
    include: [
      { model: CustomerGroup, as: "customerGroup", attributes: ["id", "code", "name"] },
      { model: Outlet, as: "outlet", attributes: ["id", "name"] },
      { model: ProductVariant, as: "variant", attributes: ["id", "sku", "barcode"] },
    ],
    order: [["priority", "DESC"], ["id", "ASC"]],
  });
};

export const createPrice = async (product_id: number, data: CreatePriceDto) => {
  const product = await Product.findOne({ where: { id: product_id, is_deleted: false } });
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  return ProductPrice.create({ product_id, ...data });
};

export const updatePrice = async (id: number, product_id: number, data: UpdatePriceDto) => {
  const price = await ProductPrice.findOne({ where: { id, product_id, is_deleted: false } });
  if (!price) throw notFoundError();
  return price.update(data);
};

export const deletePrice = async (id: number, product_id: number): Promise<void> => {
  const price = await ProductPrice.findOne({ where: { id, product_id, is_deleted: false } });
  if (!price) throw notFoundError();
  await price.update({ is_deleted: true });
};

/**
 * Resolve the best-matching price rule for a given checkout context.
 * Returns the highest-priority matching rule, falling back to the base rule.
 */
export const resolvePrice = async (params: {
  product_id: number;
  variant_id?: number;
  outlet_id?: number;
  customer_group_id?: number;
  qty: number;
  at?: Date;
}) => {
  const { product_id, variant_id, outlet_id, customer_group_id, qty, at = new Date() } = params;

  const rules = await ProductPrice.findAll({
    where: {
      product_id,
      is_deleted: false,
      status: true,
      min_qty: { [Op.lte]: qty },
      [Op.or]: [{ max_qty: null }, { max_qty: { [Op.gte]: qty } }],
      [Op.or as symbol]: [
        { valid_from: null },
        { valid_from: { [Op.lte]: at } },
      ],
      [Op.and]: [
        { [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: at } }] },
      ],
    },
    order: [["priority", "DESC"]],
  });

  // Filter by context dimensions — null means "applies to all"
  const matching = rules.filter(r => {
    if (r.variant_id !== null && r.variant_id !== variant_id) return false;
    if (r.outlet_id !== null && r.outlet_id !== outlet_id) return false;
    if (r.customer_group_id !== null && r.customer_group_id !== customer_group_id) return false;
    return true;
  });

  return matching[0] ?? null;
};
