import { Product, ProductMedia, ProductVariant, Media } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";

const MAX_IMAGES_PER_VARIANT = 5;

const notFoundError = (entity = "Product"): AppError =>
  Object.assign(new Error(`${entity} not found`), { statusCode: 404 });

// ── Get all media for a product (all variants) ─────────────────────────────────

export const getProductMedia = async (product_id: number) => {
  return ProductMedia.findAll({
    where: { product_id },
    include: [{ model: Media, as: "media", attributes: ["id", "filename", "path", "mime_type"] }],
    order: [["variant_id", "ASC"], ["sort_order", "ASC"]],
  });
};

// ── Get media for a specific variant ──────────────────────────────────────────

export const getVariantMedia = async (product_id: number, variant_id: number) => {
  return ProductMedia.findAll({
    where: { product_id, variant_id },
    include: [{ model: Media, as: "media", attributes: ["id", "filename", "path", "mime_type"] }],
    order: [["sort_order", "ASC"]],
  });
};

// ── Add image to a variant (variant_id required) ───────────────────────────────

export const addProductMedia = async (
  product_id: number,
  media_id: number,
  is_primary = false,
  variant_id: number,
) => {
  const product = await Product.findOne({ where: { id: product_id, is_deleted: false } });
  if (!product) throw notFoundError();

  const variant = await ProductVariant.findOne({ where: { id: variant_id, product_id } });
  if (!variant) throw notFoundError("Variant");

  const count = await ProductMedia.count({ where: { product_id, variant_id } });
  if (count >= MAX_IMAGES_PER_VARIANT) {
    throw Object.assign(
      new Error(`A variant can have at most ${MAX_IMAGES_PER_VARIANT} images`),
      { statusCode: 422 },
    );
  }

  // If marking as primary, clear all other primary flags for this variant
  if (is_primary) {
    await ProductMedia.update({ is_primary: false }, { where: { product_id, variant_id } });
  }

  const makePrimary = is_primary || count === 0;

  return ProductMedia.create({ product_id, media_id, variant_id, sort_order: count, is_primary: makePrimary });
};

// ── Set primary image within a variant ────────────────────────────────────────

export const setPrimary = async (product_id: number, id: number) => {
  const entry = await ProductMedia.findOne({ where: { id, product_id } });
  if (!entry) throw notFoundError("Product media");
  // Unset primary only within the same variant
  await ProductMedia.update({ is_primary: false }, { where: { product_id, variant_id: entry.variant_id } });
  return entry.update({ is_primary: true });
};

// ── Reorder images for a product (across all variants) ────────────────────────

export const reorderProductMedia = async (product_id: number, orderedIds: number[]) => {
  await Promise.all(
    orderedIds.map((id, index) =>
      ProductMedia.update({ sort_order: index }, { where: { id, product_id } })
    )
  );
  return getProductMedia(product_id);
};

// ── Remove an image (min 1 per variant enforced) ──────────────────────────────

export const removeProductMedia = async (product_id: number, id: number): Promise<void> => {
  const entry = await ProductMedia.findOne({ where: { id, product_id } });
  if (!entry) throw notFoundError("Product media");

  const count = await ProductMedia.count({ where: { product_id, variant_id: entry.variant_id } });
  if (count <= 1) {
    throw Object.assign(new Error("A variant must have at least 1 image"), { statusCode: 422 });
  }

  await entry.destroy();

  // Promote the next image as primary if the deleted one was primary
  if (entry.is_primary) {
    const next = await ProductMedia.findOne({
      where: { product_id, variant_id: entry.variant_id },
      order: [["sort_order", "ASC"]],
    });
    if (next) await next.update({ is_primary: true });
  }
};
