import { Product, ProductVariant, ProductVariantOption, VariantAttributeValue, VariantAttribute } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFoundError = (entity = "Variant"): AppError =>
  Object.assign(new Error(`${entity} not found`), { statusCode: 404 });

function generateBarcode(): string {
  // 13-digit EAN-style barcode
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  // Compute check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]!) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

async function uniqueBarcode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const barcode = generateBarcode();
    const exists = await ProductVariant.findOne({ where: { barcode } });
    if (!exists) return barcode;
    attempts++;
  }
  throw Object.assign(new Error("Failed to generate unique barcode"), { statusCode: 500 });
}

async function uniqueSku(productId: number, index: number): Promise<string> {
  const product = await Product.findByPk(productId);
  const base = product ? `${product.product_code}-V${index + 1}` : `VAR-${Date.now()}-${index}`;
  let sku = base;
  let counter = 1;
  while (true) {
    const exists = await ProductVariant.findOne({ where: { sku } });
    if (!exists) return sku;
    sku = `${base}-${counter++}`;
  }
}

export interface CreateVariantDto {
  attribute_value_ids: number[];
  sku?: string;
  sku_group?: string;
}

export const listVariants = async (product_id: number) => {
  return ProductVariant.findAll({
    where: { product_id, is_deleted: false },
    include: [
      {
        model: VariantAttributeValue,
        as: "attributeValues",
        through: { attributes: [] },
        include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
      },
    ],
    order: [["id", "ASC"]],
  });
};

export const createVariant = async (product_id: number, data: CreateVariantDto, variantIndex: number) => {
  const product = await Product.findOne({ where: { id: product_id, is_deleted: false } });
  if (!product) throw notFoundError("Product");

  const barcode = await uniqueBarcode();
  const sku = data.sku || (await uniqueSku(product_id, variantIndex));

  const variant = await ProductVariant.create({ product_id, sku, sku_group: data.sku_group ?? null, barcode });

  if (data.attribute_value_ids.length > 0) {
    await ProductVariantOption.bulkCreate(
      data.attribute_value_ids.map(attribute_value_id => ({ variant_id: variant.id, attribute_value_id })),
      { ignoreDuplicates: true }
    );
  }

  return ProductVariant.findByPk(variant.id, {
    include: [
      {
        model: VariantAttributeValue,
        as: "attributeValues",
        through: { attributes: [] },
        include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
      },
    ],
  });
};

export const updateVariant = async (id: number, product_id: number, data: { sku?: string; status?: boolean }) => {
  const variant = await ProductVariant.findOne({ where: { id, product_id, is_deleted: false } });
  if (!variant) throw notFoundError();
  return variant.update(data);
};

export const deleteVariant = async (id: number, product_id: number): Promise<void> => {
  const variant = await ProductVariant.findOne({ where: { id, product_id, is_deleted: false } });
  if (!variant) throw notFoundError();
  await variant.update({ is_deleted: true });
};
