import { Op, Transaction } from "sequelize";
import Return from "../../models/return.model";
import Vendor from "../../models/vendor.model";
import Admin from "../../models/admin.model";
import sequelize from "../../config/database";
import Grn from "../../models/grn.model";
import Purchase from "../../models/purchase.model";
import PurchaseItem from "../../models/purchaseItem.model";
import Product from "../../models/product.model";
import Material from "../../models/material.model";
import Outlet from "../../models/outlet.model";
import ReturnLineItem from "../../models/returnLineItem.model";
import ProductVariant from "../../models/productVariant.model";
import VariantAttributeValue from "../../models/variantAttributeValue.model";
import VariantAttribute from "../../models/variantAttribute.model";
import CreditNote from "../../models/creditNote.model";
import type { ListReturnsParams, ReturnSortBy, ReturnSortOrder, CreatePurchaseReturnPayload } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFound = (): AppError =>
  Object.assign(new Error("Return not found"), { statusCode: 404 });

export const listReturns = async (store_id: number | null, params: ListReturnsParams = {}) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (store_id !== null) where["store_id"] = store_id;
  if (params.type) where["type"] = params.type;

  if (params.search) {
    where[Op.or as unknown as string] = [
      { code: { [Op.like]: `%${params.search}%` } },
    ];
  }

  const sortBy: ReturnSortBy       = params.sort_by    ?? "created_ts";
  const sortOrder: ReturnSortOrder = params.sort_order ?? "DESC";

  const { rows, count } = await Return.findAndCountAll({
    where,
    include: [
      {
        model: Vendor,
        as: "vendor",
        attributes: ["id", "company_name"],
        required: false,
      },
      {
        model: Admin,
        as: "createdBy",
        attributes: ["id", "fname", "lname"],
        required: false,
      },
      {
        model: ReturnLineItem,
        as: "lineItems",
        attributes: ["id", "type", "ref_id", "variant_id", "sku", "qty"],
        required: false,
      },
      {
        model: CreditNote,
        as: "creditNotes",
        attributes: ["id", "cn_code"],
        required: false,
        limit: 1,
      },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
  });

  // Enrich line items with product/material name and code
  const allItems = rows.flatMap((r: any) => (r.lineItems ?? []) as any[]);
  const productIds  = [...new Set(allItems.filter((i: any) => i.type === "P").map((i: any) => i.ref_id as number))];
  const materialIds = [...new Set(allItems.filter((i: any) => i.type === "M").map((i: any) => i.ref_id as number))];

  const [products, materials] = await Promise.all([
    productIds.length  > 0 ? Product.findAll({ where: { id: productIds },  attributes: ["id", "name", "product_code"] }) : [],
    materialIds.length > 0 ? Material.findAll({ where: { id: materialIds }, attributes: ["id", "name", "code"] }) : [],
  ]);

  const productMap  = new Map((products  as any[]).map((p: any) => [p.id, p]));
  const materialMap = new Map((materials as any[]).map((m: any) => [m.id, m]));

  const enrichedRows = rows.map((ret: any) => {
    const plain = ret.get({ plain: true });
    plain.items = (plain.lineItems ?? []).map((item: any) => ({
      id:         item.id,
      type:       item.type,
      ref_id:     item.ref_id,
      variant_id: item.variant_id ?? null,
      sku:        item.sku ?? null,
      qty:        item.qty,
      name:       item.type === "P" ? (productMap.get(item.ref_id) as any)?.name ?? null : (materialMap.get(item.ref_id) as any)?.name ?? null,
      code:       item.type === "P" ? (productMap.get(item.ref_id) as any)?.product_code ?? null : (materialMap.get(item.ref_id) as any)?.code ?? null,
    }));
    return plain;
  });

  return { rows: enrichedRows, count };
};

export const getReturn = async (id: number, store_id: number | null) => {
  const where: Record<string, unknown> = { id };
  if (store_id !== null) where["store_id"] = store_id;

  const ret = await Return.findOne({
    where,
    include: [
      { model: Vendor, as: "vendor", attributes: ["id", "company_name"], required: false },
      { model: Admin, as: "createdBy", attributes: ["id", "fname", "lname"], required: false },
    ],
  });
  if (!ret) throw notFound();
  return ret;
};

/** Look up a full GRN by code for purchase return creation */
export const getGrnForReturn = async (code: string, store_id: number | null) => {
  const grn = await Grn.findOne({
    where: { code, is_partial: false },
    include: [
      {
        model: Purchase,
        where: store_id !== null ? { store_id } : {},
        include: [
          { model: Vendor, as: "Vendor", attributes: ["id", "company_name"] },
          { model: PurchaseItem, as: "items" },
        ],
      },
      { model: Outlet, as: "outlet", attributes: ["id", "name"], required: false },
    ],
  });
  if (!grn) {
    throw Object.assign(new Error("Full GRN not found with this code"), { statusCode: 404 });
  }

  // Enrich items with product/material names
  const purchase = grn.get("Purchase") as any;
  const items = (purchase?.items ?? []) as any[];

  const productIds  = items.filter((i: any) => i.type === "P").map((i: any) => i.ref_id);
  const materialIds = items.filter((i: any) => i.type === "M").map((i: any) => i.ref_id);

  const [products, materials] = await Promise.all([
    productIds.length > 0 ? Product.findAll({ where: { id: productIds }, attributes: ["id", "name", "product_code"] }) : [],
    materialIds.length > 0 ? Material.findAll({ where: { id: materialIds }, attributes: ["id", "name", "code"] }) : [],
  ]);

  const productMap  = new Map(products.map((p: any) => [p.id, p]));
  const materialMap = new Map(materials.map((m: any) => [m.id, m]));

  // Fetch variant attributes for items that have a variant_id
  const variantIds = [...new Set(items.filter((i: any) => i.variant_id).map((i: any) => i.variant_id as number))];
  const variants = variantIds.length > 0
    ? await ProductVariant.findAll({
        where: { id: variantIds },
        attributes: ["id"],
        include: [{
          model: VariantAttributeValue,
          as: "attributeValues",
          attributes: ["id", "value"],
          through: { attributes: [] },
          include: [{ model: VariantAttribute, as: "attribute", attributes: ["name"] }],
        }],
      })
    : [];

  const variantAttrMap = new Map<number, { name: string; value: string }[]>();
  for (const v of variants as any[]) {
    const attrs = (v.attributeValues ?? []).map((av: any) => ({
      name: av.attribute?.name ?? "",
      value: av.value,
    }));
    variantAttrMap.set(v.id, attrs);
  }

  const enrichedItems = items.map((item: any) => ({
    id: item.id,
    type: item.type,
    ref_id: item.ref_id,
    variant_id: item.variant_id ?? null,
    sku: item.sku ?? null,
    qty: item.qty,
    item_price: item.item_price,
    amount: item.amount,
    tax_amount: item.tax_amount,
    total: item.total,
    name: item.type === "P" ? (productMap.get(item.ref_id) as any)?.name ?? null : (materialMap.get(item.ref_id) as any)?.name ?? null,
    code: item.type === "P" ? (productMap.get(item.ref_id) as any)?.product_code ?? null : (materialMap.get(item.ref_id) as any)?.code ?? null,
    attributes: item.variant_id ? (variantAttrMap.get(item.variant_id) ?? []) : [],
  }));

  // Sum already-returned qty per purchase_item_id
  const existingReturns = await Return.findAll({
    where: { grn_id: grn.id },
    attributes: ["id"],
  });
  const returnIds = existingReturns.map((r: any) => r.id);
  let returnedMap = new Map<number, number>();
  if (returnIds.length > 0) {
    const returnedRows = await ReturnLineItem.findAll({
      where: { return_id: returnIds },
      attributes: ["purchase_item_id", [sequelize.fn("SUM", sequelize.col("qty")), "total_returned"]],
      group: ["purchase_item_id"],
    });
    returnedMap = new Map(returnedRows.map((r: any) => [Number(r.purchase_item_id), Number(r.get("total_returned"))]));
  }

  // Add returned_qty and remaining_qty to each enriched item
  const finalItems = enrichedItems.map(item => {
    const returned_qty = returnedMap.get(item.id) ?? 0;
    const remaining_qty = Math.max(0, Number(item.qty) - returned_qty);
    return { ...item, returned_qty, remaining_qty };
  });

  return {
    grn: {
      id: grn.id,
      code: grn.code,
      created_date: grn.created_date,
      is_return_done: grn.is_return_done,
      outlet: (grn as any).outlet,
    },
    purchase: {
      id: purchase.id,
      code: purchase.code,
      order_date: purchase.order_date,
      vendor: purchase.Vendor,
    },
    items: finalItems,
  };
};

export const createPurchaseReturn = async (
  store_id: number,
  admin_id: number,
  payload: CreatePurchaseReturnPayload
) => {
  const result = await sequelize.transaction(async (t: Transaction) => {
    // Generate code CN{YYYYMM}{6digits}
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `CN${ym}`;
    const [rows] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM \`returns\` WHERE code LIKE '${prefix}%'`,
      { transaction: t }
    ) as any;
    const seq = String((rows[0]?.cnt ?? 0) + 1).padStart(6, "0");
    const code = `${prefix}${seq}`;

    const ret = await Return.create({
      type: "PURCHASE_RETURN",
      code,
      store_id,
      outlet_id: payload.outlet_id,
      grn_id: payload.grn_id,
      vendor_id: payload.vendor_id,
      cn_amount: payload.cn_amount,
      payment_done: false,
      created_by: admin_id,
    }, { transaction: t });

    await ReturnLineItem.bulkCreate(
      payload.items.map(item => ({
        return_id: ret.id,
        purchase_item_id: item.purchase_item_id,
        store_id,
        vendor_id: payload.vendor_id,
        outlet_id: payload.outlet_id,
        type: item.type,
        ref_id: item.ref_id,
        variant_id: item.variant_id ?? null,
        sku: item.sku ?? null,
        qty: item.qty,
        item_price: item.item_price,
        amount: item.amount,
      })),
      { transaction: t }
    );

    return { return_id: ret.id, code };
  });

  // After transaction: check if all purchase items for this GRN's purchase are fully returned
  const grn = await Grn.findByPk(payload.grn_id, { attributes: ["id", "purchase_id"] });
  if (grn) {
    // Get all purchase items
    const allItems = await PurchaseItem.findAll({ where: { purchase_id: grn.purchase_id }, attributes: ["id", "qty"] });
    // Sum returned qty per purchase_item_id for all returns linked to this grn
    const returnedRows = await ReturnLineItem.findAll({
      include: [{ model: Return, as: "return", where: { grn_id: payload.grn_id }, attributes: [] }],
      attributes: ["purchase_item_id", [sequelize.fn("SUM", sequelize.col("qty")), "total_returned"]],
      group: ["purchase_item_id"],
    });
    const returnedMap = new Map(returnedRows.map((r: any) => [r.purchase_item_id, Number(r.get("total_returned"))]));
    const allDone = allItems.every(i => (returnedMap.get(i.id) ?? 0) >= Number(i.qty));
    await Grn.update({ is_return_done: allDone }, { where: { id: payload.grn_id } });
  }

  return result;
};
