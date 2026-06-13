import { Op, literal } from "sequelize";
import ProductInventory from "../../models/productInventory.model";
import Product from "../../models/product.model";
import Material from "../../models/material.model";
import ProductVariant from "../../models/productVariant.model";
import VariantAttributeValue from "../../models/variantAttributeValue.model";
import VariantAttribute from "../../models/variantAttribute.model";
import Outlet from "../../models/outlet.model";
import Category from "../../models/category.model";
import type { ListInventoryParams, InventorySortBy, InventorySortOrder } from "./types";

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listInventory = async (store_id: number | null, params: ListInventoryParams = {}) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { ...storeScope(store_id) };
  if (params.outlet_id) where["outlet_id"] = params.outlet_id;
  if (params.item_type === "P") where["material_id"] = null;
  if (params.item_type === "M") where["product_id"]  = null;

  // Stock condition filters — can both be active at once (OR logic)
  if (params.low_stock || params.no_inventory) {
    const stockConditions: ReturnType<typeof literal>[] = [];
    if (params.low_stock) {
      // low_stock_threshold is set AND saleable_qty is at or below it
      stockConditions.push(literal(
        "(`ProductInventory`.`low_stock_threshold` IS NOT NULL AND `ProductInventory`.`saleable_qty` <= `ProductInventory`.`low_stock_threshold`)"
      ));
    }
    if (params.no_inventory) {
      stockConditions.push(literal("(`ProductInventory`.`saleable_qty` = 0 OR (`ProductInventory`.`saleable_qty` + `ProductInventory`.`non_saleable_qty`) = 0)"));
    }
    where[Op.and as unknown as string] = [
      stockConditions.length === 1
        ? stockConditions[0]
        : { [Op.or]: stockConditions },
    ];
  }

  if (params.search) {
    where[Op.or as unknown as string] = [
      { sku:                      { [Op.like]: `%${params.search}%` } },
      { "$Product.name$":         { [Op.like]: `%${params.search}%` } },
      { "$Product.product_code$": { [Op.like]: `%${params.search}%` } },
      { "$material.name$":        { [Op.like]: `%${params.search}%` } },
      { "$material.code$":        { [Op.like]: `%${params.search}%` } },
    ];
  }

  const sortBy: InventorySortBy       = params.sort_by    ?? "updated_ts";
  const sortOrder: InventorySortOrder = params.sort_order ?? "DESC";

  const productInclude = {
    model: Product,
    attributes: ["id", "name", "product_code", "is_stockable"],
    required: false,
    include: [{
      model: Category,
      attributes: ["id", "name", "parent_id"],
      required: false,
      include: [{ model: Category, as: "parent", attributes: ["id", "name"], required: false }],
    }],
  };

  const variantInclude = {
    model: ProductVariant,
    as: "variant",
    attributes: ["id", "sku", "barcode"],
    required: false,
    include: [{
      model: VariantAttributeValue,
      as: "attributeValues",
      attributes: ["id", "value"],
      through: { attributes: [] },
      include: [{ model: VariantAttribute, as: "attribute", attributes: ["name"] }],
    }],
  };

  const { rows, count } = await ProductInventory.findAndCountAll({
    where,
    include: [
      productInclude,
      { model: Material, as: "material", attributes: ["id", "name", "code"], required: false },
      variantInclude,
      { model: Outlet, as: "outlet", attributes: ["id", "name"], required: false },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return { rows, count };
};

export const listAllInventory = async (store_id: number | null, params: Omit<ListInventoryParams, 'page' | 'limit'> = {}) => {
  const where: Record<string, unknown> = { ...storeScope(store_id) };
  if (params.outlet_id) where["outlet_id"] = params.outlet_id;
  if (params.item_type === "P") where["material_id"] = null;
  if (params.item_type === "M") where["product_id"]  = null;

  if (params.low_stock || params.no_inventory) {
    const stockConditions: ReturnType<typeof literal>[] = [];
    if (params.low_stock) {
      stockConditions.push(literal(
        "(`ProductInventory`.`low_stock_threshold` IS NOT NULL AND `ProductInventory`.`saleable_qty` <= `ProductInventory`.`low_stock_threshold`)"
      ));
    }
    if (params.no_inventory) {
      stockConditions.push(literal("(`ProductInventory`.`saleable_qty` = 0 OR (`ProductInventory`.`saleable_qty` + `ProductInventory`.`non_saleable_qty`) = 0)"));
    }
    where[Op.and as unknown as string] = [
      stockConditions.length === 1
        ? stockConditions[0]
        : { [Op.or]: stockConditions },
    ];
  }

  if (params.search) {
    where[Op.or as unknown as string] = [
      { sku:                      { [Op.like]: `%${params.search}%` } },
      { "$Product.name$":         { [Op.like]: `%${params.search}%` } },
      { "$Product.product_code$": { [Op.like]: `%${params.search}%` } },
      { "$material.name$":        { [Op.like]: `%${params.search}%` } },
      { "$material.code$":        { [Op.like]: `%${params.search}%` } },
    ];
  }

  const rows = await ProductInventory.findAll({
    where,
    include: [
      {
        model: Product, attributes: ["id", "name", "product_code", "is_stockable"], required: false,
        include: [{
          model: Category, attributes: ["id", "name", "parent_id"], required: false,
          include: [{ model: Category, as: "parent", attributes: ["id", "name"], required: false }],
        }],
      },
      { model: Material,       as: "material", attributes: ["id", "name", "code"],   required: false },
      {
        model: ProductVariant, as: "variant", attributes: ["id", "sku", "barcode"], required: false,
        include: [{
          model: VariantAttributeValue, as: "attributeValues", attributes: ["id", "value"],
          through: { attributes: [] },
          include: [{ model: VariantAttribute, as: "attribute", attributes: ["name"] }],
        }],
      },
      { model: Outlet,         as: "outlet",   attributes: ["id", "name"],           required: false },
    ],
    order: [["updated_ts", "DESC"]],
    subQuery: false,
  });

  return rows;
};
