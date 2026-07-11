import { Op, literal } from "sequelize"; // literal still used for variant_count subquery
import { Product, Category, Media, ProductPrice, ProductVariant, VariantAttributeValue, VariantAttribute, ProductInventory } from "../../models/index";
import type { ProductQuery } from "./types";

// Builds a map: `${product_id}_${variant_id ?? 'null'}` → saleable_qty
// Uses nearest-outlet-first priority (outletIds must be ordered closest → farthest).
async function buildInventoryMap(productIds: number[], outletIds: number[]): Promise<Map<string, number>> {
  const records = await ProductInventory.findAll({
    where: { product_id: productIds, outlet_id: outletIds },
    attributes: ["product_id", "variant_id", "outlet_id", "saleable_qty"],
  });

  // Group by outlet for ordered iteration
  const byOutlet = new Map<number, typeof records>();
  for (const r of records) byOutlet.set(r.outlet_id, [...(byOutlet.get(r.outlet_id) ?? []), r]);

  const map = new Map<string, number>();
  for (const outletId of outletIds) {
    for (const r of byOutlet.get(outletId) ?? []) {
      const key = `${r.product_id}_${r.variant_id ?? "null"}`;
      if (!map.has(key) && r.saleable_qty > 0) {
        map.set(key, r.saleable_qty);
      }
    }
  }

  return map;
}

const SORT_ORDER: Record<string, [string, string][]> = {
  "newest":     [["created_ts", "DESC"]],
  "oldest":     [["created_ts", "ASC"]],
  "name-asc":   [["name", "ASC"]],
  "name-desc":  [["name", "DESC"]],
  "relevance":  [["created_ts", "DESC"]],
  "popular":    [["created_ts", "DESC"]],
  "rating":     [["created_ts", "DESC"]],
  "price-asc":  [["created_ts", "DESC"]], // price sort handled post-query
  "price-desc": [["created_ts", "DESC"]],
};

export const getProducts = async (query: ProductQuery, outletIds: number[] = []) => {
  const { search, category_id, page = 1, limit = 20, sort = "newest", price_min, price_max } = query;

  const where: Record<string, unknown> = {
    status: true,
    is_draft: false,
    is_deleted: false,
  };
  if (category_id) where["category_id"] = category_id;

  if (search) {
    const trimmed = search.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length > 1) {
      // Multi-word: every word must appear somewhere in name or description
      (where as any)[Op.and] = words.map(w => ({
        [Op.or]: [
          { name:              { [Op.like]: `%${w}%` } },
          { short_description: { [Op.like]: `%${w}%` } },
        ],
      }));
    } else {
      // Single word: substring match across name and description
      (where as any)[Op.or] = [
        { name:              { [Op.like]: `%${trimmed}%` } },
        { short_description: { [Op.like]: `%${trimmed}%` } },
      ];
    }
  }

  const priceWhere: Record<string, unknown> = { status: true, is_deleted: false };
  if (price_min) priceWhere["price"] = { ...(priceWhere["price"] as object ?? {}), [Op.gte]: Number(price_min) };
  if (price_max) priceWhere["price"] = { ...(priceWhere["price"] as object ?? {}), [Op.lte]: Number(price_max) };
  const priceRequired = !!(price_min || price_max);

  const result = await Product.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          literal(`(SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = \`Product\`.\`id\` AND pv.status = 1 AND pv.is_deleted = 0)`),
          "variant_count",
        ],
      ],
    },
    include: [
      { model: Category,     attributes: ["id", "name"] },
      {
        model: Media,
        as: "images",
        attributes: ["id", "path", "filename"],
        through: { attributes: ["sort_order", "is_primary"] },
        required: false,
      },
      {
        model: ProductPrice,
        as: "prices",
        attributes: ["id", "variant_id", "price", "compare_at_price", "final_price"],
        where: priceWhere,
        required: priceRequired,
      },
      {
        model: ProductVariant,
        as: "variants",
        where: { status: true, is_deleted: false },
        required: false,
        include: [
          {
            model: VariantAttributeValue,
            as: "attributeValues",
            through: { attributes: [] },
            include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
            attributes: ["id", "value"],
          },
          {
            model: ProductPrice,
            as: "prices",
            attributes: ["id", "price", "compare_at_price", "final_price"],
            where: { status: true, is_deleted: false },
            required: false,
          },
        ],
      },
    ],
    limit:    Number(limit),
    offset:   (Number(page) - 1) * Number(limit),
    order:    (SORT_ORDER[sort] ?? SORT_ORDER["newest"]) as any,
    distinct: true,
  });

  // Enrich with inventory if outlet context provided
  if (outletIds.length > 0) {
    const stockableIds = result.rows.filter(p => p.is_stockable).map(p => p.id);
    const invMap = stockableIds.length > 0
      ? await buildInventoryMap(stockableIds, outletIds)
      : new Map<string, number>();

    const enriched = result.rows.map(p => {
      const json = p.toJSON() as any;
      json.is_stockable = p.is_stockable;
      if (!p.is_stockable) {
        json.stock_qty = null; // not tracked
        return json;
      }
      const variants: any[] = json.variants ?? [];
      // Product-level fallback (variant_id = null in inventory table)
      const productLevelQty = invMap.get(`${p.id}_null`) ?? 0;
      if (variants.length === 0) {
        json.stock_qty = productLevelQty;
      } else {
        // Per-variant inventory; fall back to product-level qty if no variant row exists
        let maxQty = 0;
        json.variants = variants.map((v: any) => {
          const qty = invMap.get(`${p.id}_${v.id}`) ?? productLevelQty;
          if (qty > maxQty) maxQty = qty;
          return { ...v, stock_qty: qty };
        });
        json.stock_qty = maxQty;
      }
      return json;
    });

    // In-stock (or non-stockable) products first, out-of-stock last
    enriched.sort((a, b) => {
      const aOut = a.is_stockable && a.stock_qty === 0 ? 1 : 0;
      const bOut = b.is_stockable && b.stock_qty === 0 ? 1 : 0;
      return aOut - bOut;
    });

    return { count: result.count, rows: enriched };
  }

  return result;
};

export const getProductById = async (id: string) => {
  const where: Record<string, unknown> = isNaN(Number(id))
    ? { slug: id, status: true, is_draft: false, is_deleted: false }
    : { id: Number(id), status: true, is_draft: false, is_deleted: false };

  return Product.findOne({
    where,
    include: [
      { model: Category, attributes: ["id", "name", "slug", "parent_id"] },
      {
        model: Media,
        as: "images",
        attributes: ["id", "path", "filename"],
        through: { attributes: ["sort_order", "is_primary"] },
        required: false,
      },
      {
        model: ProductPrice,
        as: "prices",
        attributes: ["id", "price", "compare_at_price", "final_price"],
        where: { variant_id: null, status: true, is_deleted: false },
        required: false,
      },
      {
        model: ProductVariant,
        as: "variants",
        where: { status: true, is_deleted: false },
        required: false,
        include: [
          {
            model: VariantAttributeValue,
            as: "attributeValues",
            through: { attributes: [] },
            include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
            attributes: ["id", "value"],
          },
          {
            model: ProductPrice,
            as: "prices",
            attributes: ["id", "price", "compare_at_price", "final_price"],
            where: { status: true, is_deleted: false },
            required: false,
          },
        ],
      },
    ],
  });
};
