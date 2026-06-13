import { Op, literal } from "sequelize";
import { Product, ProductOutlet, Category, Outlet, Brand } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateProductDto, UpdateProductDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Product not found"), { statusCode: 404 });

// Superadmin (store_id = null) sees all products.
// Store admins see their own store's products plus global products (store_id IS NULL).
// Op.is: null is used explicitly to generate IS NULL, not = NULL.
function storeScope(store_id: number | null): Record<string | symbol, unknown> {
  if (store_id === null) return {};
  return { [Op.or]: [{ store_id }, { store_id: { [Op.is]: null } }] };
}

function generateProductCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "PRD";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueProductCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  do {
    code = generateProductCode();
    const exists = await Product.findOne({ where: { product_code: code } });
    if (!exists) return code;
    attempts++;
  } while (attempts < 10);
  throw Object.assign(new Error("Failed to generate unique product code"), { statusCode: 500 });
}

function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const where: Record<string, unknown> = { slug };
    if (excludeId) where["id"] = { [Op.ne]: excludeId };
    const exists = await Product.findOne({ where });
    if (!exists) return slug;
    slug = `${base}-${counter++}`;
  }
}

export interface ListProductsOptions {
  status?: "active" | "inactive" | "draft";
  category_id?: number;
  outlet_id?: number;
  is_stockable?: boolean;
  low_stock?: boolean;
  search?: string;
  sort_by?: "name" | "created_ts";
  sort_dir?: "asc" | "desc";
}

export const listProducts = async (
  page: number,
  limit: number,
  store_id: number | null,
  opts: ListProductsOptions = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string | symbol, any> = { is_deleted: false, ...storeScope(store_id) };

  if (opts.status === "active")         { where["status"] = true;  where["is_draft"] = false; }
  else if (opts.status === "inactive")  { where["status"] = false; where["is_draft"] = false; }
  else if (opts.status === "draft")     { where["is_draft"] = true; }

  if (opts.category_id)                 where["category_id"] = opts.category_id;
  if (opts.is_stockable !== undefined)  where["is_stockable"] = opts.is_stockable;

  if (opts.search) {
    const term = `%${opts.search}%`;
    // Use Op.and to avoid overwriting storeScope's Op.or
    where[Op.and] = [
      { [Op.or]: [{ name: { [Op.like]: term } }, { product_code: { [Op.like]: term } }] },
    ];
  }

  if (opts.low_stock) {
    where["id"] = {
      [Op.in]: literal(
        "(SELECT DISTINCT product_id FROM inventory WHERE saleable_qty <= COALESCE(low_stock_threshold, 0))"
      ),
    };
  }

  const outletInclude = opts.outlet_id
    ? { model: Outlet, as: "outlets", attributes: ["id", "name"], through: { attributes: [] }, required: true,  where: { id: opts.outlet_id } }
    : { model: Outlet, as: "outlets", attributes: ["id", "name"], through: { attributes: [] }, required: false };

  const sortField = opts.sort_by  ?? "created_ts";
  const sortDir   = (opts.sort_dir ?? "desc").toUpperCase();

  const { rows, count } = await Product.findAndCountAll({
    where,
    attributes: {
      include: [
        [literal("(SELECT COUNT(*) FROM product_variants WHERE product_id = `Product`.`id` AND is_deleted = 0)"), "variant_count"],
        [literal("(SELECT COUNT(*) FROM product_media WHERE product_id = `Product`.`id`)"), "media_count"],
      ],
    },
    include: [
      { model: Category, as: "Category", attributes: ["id", "name"] },
      outletInclude,
    ],
    limit,
    offset: (page - 1) * limit,
    order: [[sortField, sortDir]],
    distinct: true,
  });

  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getProductById = async (id: number, store_id: number | null) => {
  const where: Record<string | symbol, unknown> = { id, is_deleted: false, ...storeScope(store_id) };
  const product = await Product.findOne({
    where,
    include: [
      { model: Category, as: "Category", attributes: ["id", "name"] },
      { model: Outlet, as: "outlets", attributes: ["id", "name"], through: { attributes: [] } },
      { model: Brand, as: "brand", attributes: ["id", "name", "slug"] },
    ],
  });
  if (!product) throw notFoundError();
  return product;
};

export const createProduct = async (data: CreateProductDto) => {
  const product_code = await uniqueProductCode();
  const slugBase = generateSlug(data.name);
  const slug = await uniqueSlug(slugBase);

  const { outlet_ids, ...rest } = data;
  const product = await Product.create({ ...rest, product_code, slug });

  if (outlet_ids && outlet_ids.length > 0) {
    await ProductOutlet.bulkCreate(
      outlet_ids.map(outlet_id => ({ product_id: product.id, outlet_id })),
      { ignoreDuplicates: true }
    );
  }

  return getProductById(product.id, data.store_id);
};

export const updateProduct = async (id: number, data: UpdateProductDto, store_id: number | null) => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const product = await Product.findOne({ where });
  if (!product) throw notFoundError();

  const { outlet_ids, ...rest } = data;

  if (rest.name) {
    const slugBase = generateSlug(rest.name);
    (rest as Record<string, unknown>)["slug"] = await uniqueSlug(slugBase, id);
  }

  await product.update(rest);

  if (outlet_ids !== undefined) {
    await ProductOutlet.destroy({ where: { product_id: id } });
    if (outlet_ids.length > 0) {
      await ProductOutlet.bulkCreate(
        outlet_ids.map(outlet_id => ({ product_id: id, outlet_id })),
        { ignoreDuplicates: true }
      );
    }
  }

  return getProductById(id, store_id);
};

export const deleteProduct = async (id: number, store_id: number | null, deletedBy: number): Promise<void> => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const product = await Product.findOne({ where });
  if (!product) throw notFoundError();
  await product.update({ is_deleted: true, deleted_by: deletedBy });
};

export const restoreProduct = async (id: number, store_id: number | null): Promise<void> => {
  const where = { id, is_deleted: true, ...storeScope(store_id) };
  const product = await Product.findOne({ where });
  if (!product) throw Object.assign(new Error("Product not found in trash"), { statusCode: 404 });
  await product.update({ is_deleted: false });
};

export const changeProductStatus = async (id: number, store_id: number | null) => {
  const where = { id, is_deleted: false, ...storeScope(store_id) };
  const product = await Product.findOne({ where });
  if (!product) throw notFoundError();
  const newStatus = !product.status;
  // Publishing a draft clears the draft flag
  return product.update({ status: newStatus, is_draft: newStatus ? false : product.is_draft });
};
