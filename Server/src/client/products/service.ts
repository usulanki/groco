import { Op, literal } from "sequelize";
import { Product, Category, Media, ProductPrice, ProductVariant, VariantAttributeValue, VariantAttribute } from "../../models/index";
import type { ProductQuery } from "./types";

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

export const getProducts = async (query: ProductQuery) => {
  const { search, category_id, page = 1, limit = 20, sort = "newest", price_min, price_max } = query;

  const where: Record<string, unknown> = {
    status: true,
    is_draft: false,
    is_deleted: false,
  };
  if (category_id) where["category_id"] = category_id;

  let overrideOrder: any = null;
  if (search) {
    const trimmed = search.trim();
    if (trimmed.length >= 4) {
      // MySQL FULLTEXT — relevance-ranked, searches name + short_description
      const matchExpr = literal(
        `MATCH(Product.name, Product.short_description) AGAINST(${Product.sequelize!.escape(trimmed + '*')} IN BOOLEAN MODE)`
      );
      (where as any)[Op.and] = matchExpr;
      if (!sort || sort === "newest" || sort === "relevance") {
        overrideOrder = [[matchExpr, "DESC"]];
      }
    } else {
      // Short query (<4 chars) — fall back to LIKE, MySQL FULLTEXT min token size is 4
      where["name"] = { [Op.like]: `%${trimmed}%` };
    }
  }

  const priceWhere: Record<string, unknown> = { variant_id: null, status: true, is_deleted: false };
  if (price_min) priceWhere["price"] = { ...(priceWhere["price"] as object ?? {}), [Op.gte]: Number(price_min) };
  if (price_max) priceWhere["price"] = { ...(priceWhere["price"] as object ?? {}), [Op.lte]: Number(price_max) };
  const priceRequired = !!(price_min || price_max);

  return Product.findAndCountAll({
    where,
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
        attributes: ["id", "price", "compare_at_price", "final_price"],
        where: priceWhere,
        required: priceRequired,
      },
    ],
    limit:    Number(limit),
    offset:   (Number(page) - 1) * Number(limit),
    order:    (overrideOrder ?? SORT_ORDER[sort] ?? SORT_ORDER["newest"]) as any,
    distinct: true,
  });
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
