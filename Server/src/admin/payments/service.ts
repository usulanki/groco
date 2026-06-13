import { Op } from "sequelize";
import Transaction from "../../models/transaction.model";
import CreditNote from "../../models/creditNote.model";
import Return from "../../models/return.model";
import Grn from "../../models/grn.model";
import Purchase from "../../models/purchase.model";
import PurchaseItem from "../../models/purchaseItem.model";
import Vendor from "../../models/vendor.model";
import Admin from "../../models/admin.model";
import type { ListPaymentsParams, PaymentSortBy, PaymentSortOrder, CreateVendorPaymentDto } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

// ─── Code generator ───────────────────────────────────────────────────────────

async function generateCode(): Promise<string> {
  const today  = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `TXN${today}`;
  const latest = await Transaction.findOne({
    where: { code: { [Op.like]: `${prefix}%` } },
    order: [["code", "DESC"]],
  });
  const next = latest ? parseInt(latest.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}

// ─── List ──────────────────────────────────────────────────────────────────────

export const listPayments = async (store_id: number | null, params: ListPaymentsParams = {}) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {
    // Never surface zero-amount adjustment records in any list
    payment_type: { [Op.ne]: "Adjust" },
  };
  if (store_id !== null) whereClause["store_id"] = store_id;
  if (params.type)      whereClause["type"]      = params.type;
  if (params.vendor_id) whereClause["vendor_id"] = params.vendor_id;

  if (params.search) {
    whereClause[Op.or as unknown as string] = [
      { code: { [Op.like]: `%${params.search}%` } },
      { name: { [Op.like]: `%${params.search}%` } },
    ];
  }

  const sortBy: PaymentSortBy       = params.sort_by    ?? "created_ts";
  const sortOrder: PaymentSortOrder = params.sort_order ?? "DESC";

  const { rows, count } = await Transaction.findAndCountAll({
    where: whereClause,
    include: [
      { model: Admin, as: "createdBy", attributes: ["id", "fname", "lname"], required: false },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
  });

  return { rows, count };
};

// ─── Vendor credit notes (unpaid) ─────────────────────────────────────────────

export const listVendorCreditNotes = async (store_id: number | null, vendor_id: number) => {
  const where: Record<string, unknown> = {
    vendor_id,
    payment_id: null,
  };
  if (store_id !== null) where["store_id"] = store_id;

  const rows = await CreditNote.findAll({
    where,
    include: [
      { model: Return, as: "return", attributes: ["id", "code", "cn_amount"] },
      { model: Vendor, as: "vendor", attributes: ["id", "company_name"] },
    ],
    order: [["created_ts", "DESC"]],
  });

  return rows;
};

// ─── Vendor data for new payment page ────────────────────────────────────────

export const getVendorData = async (store_id: number | null, vendor_id: number) => {
  const cnWhere: Record<string, unknown> = { vendor_id, payment_id: null };
  if (store_id !== null) cnWhere["store_id"] = store_id;

  // Fetch all unpaid credit notes for this vendor (include return for cn_amount)
  const creditNotes = await CreditNote.findAll({
    where: cnWhere,
    include: [{ model: Return, as: "return", attributes: ["id", "code", "cn_amount"] }],
    order: [["created_ts", "DESC"]],
  });

  // Unique GRN codes referenced by these credit notes
  const grnCodes = [...new Set(creditNotes.map((cn) => cn.grn_code).filter(Boolean))];

  // Fetch those GRNs with their purchase + purchase items (for totals)
  const grns = grnCodes.length
    ? await Grn.findAll({
        where: { code: { [Op.in]: grnCodes } },
        include: [
          {
            model: Purchase,
            // no alias — Grn.belongsTo(Purchase) has no alias
            include: [
              {
                model: PurchaseItem,
                as: "items",
                attributes: ["amount", "tax_amount", "total"],
              },
            ],
            attributes: ["id", "code"],
          },
        ],
        attributes: ["id", "code", "purchase_id", "created_date", "created_ts"],
      })
    : [];

  // Build GRN summaries annotated with which CN ids belong to them
  const grnList = grns.map((grn) => {
    const purchase = (grn as any).Purchase as any;
    const items: any[] = purchase?.items ?? [];
    const subtotal  = items.reduce((s: number, i: any) => s + Number(i.amount),     0);
    const tax_total = items.reduce((s: number, i: any) => s + Number(i.tax_amount), 0);
    const grand_total = items.reduce((s: number, i: any) => s + Number(i.total),    0);

    const linkedCnIds = creditNotes
      .filter((cn) => cn.grn_code === grn.code)
      .map((cn) => cn.id);

    return {
      id:              grn.id,
      code:            grn.code,
      purchase_id:     grn.purchase_id,
      purchase_code:   purchase?.code ?? null,
      created_date:    grn.created_date,
      subtotal:        subtotal.toFixed(2),
      tax_total:       tax_total.toFixed(2),
      grand_total:     grand_total.toFixed(2),
      linked_cn_ids:   linkedCnIds,
    };
  });

  // Build CN list with amount from return
  const cnList = creditNotes.map((cn) => ({
    id:            cn.id,
    cn_code:       cn.cn_code,
    grn_code:      cn.grn_code,
    purchase_code: cn.purchase_code,
    created_ts:    cn.created_ts,
    return_id:     cn.return_id,
    return_code:   (cn as any).return?.code   ?? null,
    cn_amount:     (cn as any).return?.cn_amount ?? "0.00",
  }));

  return { grns: grnList, credit_notes: cnList };
};

// ─── Create vendor payment ────────────────────────────────────────────────────

export const createVendorPayment = async (
  store_id: number,
  admin_id: number,
  dto: CreateVendorPaymentDto,
) => {
  const vendor = await Vendor.findOne({
    where: { id: dto.vendor_id, is_deleted: false, ...(store_id ? { store_id } : {}) },
  });
  if (!vendor) {
    throw Object.assign(new Error("Vendor not found"), { statusCode: 404 }) as AppError;
  }

  const code = await generateCode();

  const amount = parseFloat(String(dto.amount));
  const payment_type = amount > 0 ? "Paid" : amount < 0 ? "Received" : "Adjust";

  const txn = await Transaction.create({
    store_id,
    outlet_id:    dto.outlet_id ?? null,
    vendor_id:    dto.vendor_id,
    type:         "VENDOR",
    payment_type: payment_type as any,
    code,
    name:         vendor.company_name,
    phone:        vendor.owner_phone ?? null,
    email:        vendor.owner_email ?? null,
    channel:      dto.channel,
    payment_mode: dto.payment_mode,
    ref_no:       dto.ref_no ?? null,
    amount:       dto.amount,
    payment_date: dto.payment_date,
    notes:        dto.notes ?? null,
    created_by:   admin_id,
  });

  // Link selected credit notes to this payment
  if (dto.credit_note_ids?.length) {
    await CreditNote.update(
      { payment_id: txn.id },
      { where: { id: { [Op.in]: dto.credit_note_ids }, vendor_id: dto.vendor_id } },
    );

    // Mark the corresponding returns as payment done
    const linkedCns = await CreditNote.findAll({
      where: { id: { [Op.in]: dto.credit_note_ids } },
      attributes: ["return_id"],
    });
    const returnIds = linkedCns.map((cn) => cn.return_id).filter(Boolean);
    if (returnIds.length) {
      await Return.update(
        { payment_done: true },
        { where: { id: { [Op.in]: returnIds } } },
      );
    }
  }

  return { id: txn.id, code: txn.code };
};
