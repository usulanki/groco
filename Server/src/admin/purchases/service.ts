import { Op, literal, type Transaction } from "sequelize";
import Purchase from "../../models/purchase.model";
import PurchaseItem from "../../models/purchaseItem.model";
import Invoice from "../../models/invoice.model";
import Vendor from "../../models/vendor.model";
import Admin from "../../models/admin.model";
import Product from "../../models/product.model";
import Material from "../../models/material.model";
import ProductInventory from "../../models/productInventory.model";
import Outlet from "../../models/outlet.model";
import Grn from "../../models/grn.model";
import sequelize from "../../config/database";
import type { CreatePurchaseDto, UpdatePurchaseDto, ListPurchasesParams, CreateGrnDto, SortBy, SortOrder } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFound = (): AppError =>
  Object.assign(new Error("Purchase not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

function randomCode(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function generateInvoiceNo(store_id: number, t: import("sequelize").Transaction): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `PRINV${today}`;
  const latest = await Invoice.findOne({
    where: { store_id, invoice_no: { [Op.like]: `${prefix}%` } },
    order: [["invoice_no", "DESC"]],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  const nextSerial = latest ? parseInt(latest.invoice_no.slice(prefix.length), 10) + 1 : 0;
  return `${prefix}${String(nextSerial).padStart(6, "0")}`;
}

async function generateUniqueCode(store_id: number): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode();
    const exists = await Purchase.findOne({ where: { code, store_id } });
    if (!exists) return code;
  }
  throw Object.assign(new Error("Failed to generate unique purchase code."), { statusCode: 500 });
}

export const listPurchases = async (store_id: number | null, params: ListPurchasesParams = {}) => {
  const page  = Math.max(1, params.page  ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { ...storeScope(store_id) };
  if (params.search)                     where["code"]       = { [Op.like]: `%${params.search}%` };
  if (params.pr_state)                   where["pr_state"]   = params.pr_state;
  if (params.vendor_id)                  where["vendor_id"]  = params.vendor_id;
  if (params.outlet_id != null)          where["outlet_id"]  = params.outlet_id;

  const andConditions: ReturnType<typeof literal>[] = [];

  if (params.item_type) {
    andConditions.push(literal(
      `EXISTS (SELECT 1 FROM purchase_items pi WHERE pi.purchase_id = \`Purchase\`.\`id\` AND pi.type = '${params.item_type}')`,
    ));
  }

  if (params.subcategory_id) {
    andConditions.push(literal(
      `EXISTS (SELECT 1 FROM purchase_items pi2 JOIN products p2 ON p2.id = pi2.ref_id ` +
      `WHERE pi2.purchase_id = \`Purchase\`.\`id\` AND pi2.type = 'P' AND p2.category_id = ${params.subcategory_id})`,
    ));
  } else if (params.category_id) {
    andConditions.push(literal(
      `EXISTS (SELECT 1 FROM purchase_items pi2 JOIN products p2 ON p2.id = pi2.ref_id ` +
      `WHERE pi2.purchase_id = \`Purchase\`.\`id\` AND pi2.type = 'P' AND ` +
      `(p2.category_id = ${params.category_id} OR p2.category_id IN (SELECT id FROM categories WHERE parent_id = ${params.category_id})))`,
    ));
  }

  const sortBy: SortBy       = params.sort_by    ?? "created_ts";
  const sortOrder: SortOrder = params.sort_order ?? "DESC";

  const { rows, count } = await Purchase.findAndCountAll({
    where: andConditions.length > 0 ? { ...where, [Op.and]: andConditions } : where,
    attributes: {
      include: [
        [literal("(SELECT COUNT(*) FROM purchase_items WHERE purchase_id = `Purchase`.`id`)"), "item_count"],
        [literal("(SELECT COALESCE(SUM(total), 0) FROM purchase_items WHERE purchase_id = `Purchase`.`id`)"), "total_amount"],
      ],
    },
    include: [
      { model: Vendor,  as: "Vendor",    attributes: ["id", "company_name"] },
      { model: Admin,   as: "CreatedBy", attributes: ["id", "fname", "lname"] },
      { model: Invoice, as: "Invoice",   attributes: ["id", "invoice_no"] },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
  });
  return { rows, count };
};

export const getPurchase = async (id: number, store_id: number | null) => {
  const purchase = await Purchase.findOne({
    where: { id, ...storeScope(store_id) },
    include: [
      { model: Vendor,       as: "Vendor",    attributes: ["id", "company_name"] },
      { model: Admin,        as: "CreatedBy", attributes: ["id", "fname", "lname"] },
      { model: Admin,        as: "GrnBy",     attributes: ["id", "fname", "lname"] },
      { model: Invoice,      as: "Invoice",   attributes: ["id", "invoice_no"] },
      { model: PurchaseItem, as: "items" },
    ],
  });
  if (!purchase) throw notFound();

  // Enrich items with product/material names
  const items = (purchase.get("items") as PurchaseItem[]) ?? [];
  const productIds  = items.filter(i => i.type === "P").map(i => i.ref_id);
  const materialIds = items.filter(i => i.type === "M").map(i => i.ref_id);

  const [products, materials] = await Promise.all([
    productIds.length
      ? Product.findAll({ where: { id: productIds }, attributes: ["id", "name", "product_code"] })
      : [],
    materialIds.length
      ? Material.findAll({ where: { id: materialIds }, attributes: ["id", "name", "code"] })
      : [],
  ]);

  const productMap  = new Map(products.map(p  => [p.id, p]));
  const materialMap = new Map(materials.map(m => [m.id, m]));

  const enrichedItems = items.map(item => {
    const plain = item.get({ plain: true }) as unknown as Record<string, unknown>;
    if (item.type === "P") {
      const p = productMap.get(item.ref_id);
      return { ...plain, name: p?.name ?? null, code: p?.product_code ?? null };
    } else {
      const m = materialMap.get(item.ref_id);
      return { ...plain, name: m?.name ?? null, code: m?.code ?? null };
    }
  });

  return { ...(purchase.get({ plain: true }) as object), items: enrichedItems };
};

export const createPurchase = async (data: CreatePurchaseDto) => {
  const code = await generateUniqueCode(data.store_id);
  const { items, ...purchaseData } = data;
  const module = items[0]?.type === "P" ? "PRODUCT PURCHASE" : "MATERIAL PURCHASE";

  const purchase = await sequelize.transaction(async (t) => {
    const invoice_no = await generateInvoiceNo(data.store_id, t);
    const invoice = await Invoice.create(
      { store_id: data.store_id, invoice_no, module, created_by: data.created_by },
      { transaction: t },
    );

    const po = await Purchase.create(
      { ...purchaseData, code, invoice_ref_id: invoice.id },
      { transaction: t },
    );

    const itemRows = items.map((item) => {
      const amount = item.qty * item.item_price;
      const tax_amount = item.tax_amount ?? 0;
      return {
        purchase_id: po.id,
        type: item.type,
        ref_id: item.ref_id,
        variant_id: item.variant_id ?? null,
        sku: item.sku ?? null,
        qty: item.qty,
        item_price: item.item_price,
        amount,
        tax_amount,
        total: amount + tax_amount,
      };
    });
    await PurchaseItem.bulkCreate(itemRows, { transaction: t });
    return po;
  });

  return purchase;
};

export const updatePurchase = async (id: number, data: UpdatePurchaseDto, store_id: number | null) => {
  const purchase = await Purchase.findOne({ where: { id, ...storeScope(store_id) } });
  if (!purchase) throw notFound();
  return purchase.update(data);
};

// ─── GRN helpers ──────────────────────────────────────────────────────────────

async function generateGrnCode(t: Transaction): Promise<string> {
  const today  = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `GRN${today}`;
  const latest = await Grn.findOne({
    where: { code: { [Op.like]: `${prefix}%` } },
    order: [["code", "DESC"]],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  const next = latest ? parseInt(latest.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function upsertInventory(params: {
  product_id?: number | null;
  material_id?: number | null;
  store_id: number;
  outlet_id: number;
  sku: string;
  qty: number;
  t: Transaction;
}): Promise<void> {
  const { product_id, material_id, store_id, outlet_id, sku, qty, t } = params;

  const whereClause = product_id
    ? { product_id, store_id, outlet_id }
    : { material_id, store_id, outlet_id };

  const existing = await ProductInventory.findOne({
    where: whereClause,
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  if (existing) {
    await existing.increment("saleable_qty", { by: qty, transaction: t });
  } else {
    await ProductInventory.create(
      {
        product_id:  product_id  ?? null,
        material_id: material_id ?? null,
        variant_id:  null,
        store_id,
        outlet_id,
        sku,
        saleable_qty:     qty,
        non_saleable_qty: 0,
      },
      { transaction: t },
    );
  }
}

// ─── createGrn ────────────────────────────────────────────────────────────────

export const createGrn = async (id: number, store_id: number | null, dto: CreateGrnDto) => {
  const purchase = await Purchase.findOne({
    where: { id, ...storeScope(store_id) },
    include: [{ model: PurchaseItem, as: "items" }],
  });
  if (!purchase) throw notFound();

  const allItems = (purchase.get("items") as PurchaseItem[]) ?? [];
  if (allItems.length === 0) throw Object.assign(new Error("Purchase has no items."), { statusCode: 400 });

  const newlyGrnIds = new Set(dto.item_ids);
  const newlyGrnItems = allItems.filter(i => newlyGrnIds.has(i.id));
  const allDone = allItems.every(i => i.is_grn_done || newlyGrnIds.has(i.id));
  const isPartial = !allDone;

  let grnRecord!: Grn;

  await sequelize.transaction(async (t) => {
    // 1. Mark selected purchase items as GRN done
    if (newlyGrnIds.size > 0) {
      await PurchaseItem.update(
        { is_grn_done: true },
        { where: { id: [...newlyGrnIds], purchase_id: id }, transaction: t },
      );
    }

    // 2. Update purchase state
    const newState = allDone ? "GRN_DONE" : "PARTIAL_GRN";
    const today    = new Date().toISOString().slice(0, 10);
    await purchase.update({ pr_state: newState, grn_date: today, grn_by: dto.grn_by }, { transaction: t });

    // 3. Insert GRN record
    const grnCode = await generateGrnCode(t);
    const grnOutletId = purchase.outlet_id ?? dto.outlet_id ?? null;
    grnRecord = await Grn.create(
      { code: grnCode, purchase_id: id, outlet_id: grnOutletId, created_date: today, is_partial: isPartial, created_by: dto.grn_by },
      { transaction: t },
    );

    // 4. If full GRN, link any prior partial GRNs for this purchase
    if (!isPartial) {
      await Grn.update(
        { full_grn_id: grnRecord.id },
        { where: { purchase_id: id, is_partial: true, full_grn_id: null }, transaction: t },
      );
    }

    // 5. Resolve outlet for inventory — prefer purchase.outlet_id, fall back to first store outlet
    let inventoryOutletId: number | null = purchase.outlet_id ?? null;
    if (inventoryOutletId == null) {
      const defaultOutlet = await Outlet.findOne({
        where: { store_id: purchase.store_id, status: true, is_deleted: false },
        order: [["id", "ASC"]],
        transaction: t,
      });
      inventoryOutletId = defaultOutlet?.id ?? null;
    }
    if (inventoryOutletId == null) return; // no outlet configured — skip inventory

    // 6. Handle product inventory (is_stockable = true)
    const productItems = newlyGrnItems.filter(i => i.type === "P");
    if (productItems.length > 0) {
      const productIds = productItems.map(i => i.ref_id);
      const stockableProducts = await Product.findAll({
        where: { id: productIds, is_stockable: true },
        attributes: ["id", "product_code"],
        transaction: t,
      });
      const stockableMap = new Map(stockableProducts.map(p => [p.id, p]));

      for (const item of productItems) {
        const product = stockableMap.get(item.ref_id);
        if (!product) continue;
        await upsertInventory({
          product_id: item.ref_id,
          store_id:   purchase.store_id,
          outlet_id:  inventoryOutletId,
          sku:        `${product.product_code}-S${purchase.store_id}-O${inventoryOutletId}`,
          qty:        Math.round(Number(item.qty)),
          t,
        });
      }
    }

    // 7. Handle material inventory (allow_inventory = true)
    const materialItems = newlyGrnItems.filter(i => i.type === "M");
    if (materialItems.length > 0) {
      const materialIds = materialItems.map(i => i.ref_id);
      const trackableMaterials = await Material.findAll({
        where: { id: materialIds, allow_inventory: true },
        attributes: ["id", "code"],
        transaction: t,
      });
      const trackableMap = new Map(trackableMaterials.map(m => [m.id, m]));

      for (const item of materialItems) {
        const material = trackableMap.get(item.ref_id);
        if (!material) continue;
        await upsertInventory({
          material_id: item.ref_id,
          store_id:    purchase.store_id,
          outlet_id:   inventoryOutletId,
          sku:         `MAT-${material.code}-S${purchase.store_id}-O${inventoryOutletId}`,
          qty:         Math.round(Number(item.qty)),
          t,
        });
      }
    }
  });

  return {
    pr_state: allDone ? "GRN_DONE" : "PARTIAL_GRN",
    grn_code: grnRecord.code,
    grn_id:   grnRecord.id,
  };
};
