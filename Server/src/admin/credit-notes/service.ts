import { Op } from "sequelize";
import CreditNote from "../../models/creditNote.model";
import Return from "../../models/return.model";
import Admin from "../../models/admin.model";
import Outlet from "../../models/outlet.model";
import Vendor from "../../models/vendor.model";
import type { CreateCreditNoteDto } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFound = (): AppError =>
  Object.assign(new Error("Credit note not found"), { statusCode: 404 });

const returnNotFound = (): AppError =>
  Object.assign(new Error("Return not found"), { statusCode: 404 });

async function generateCode(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `CDN${today}`;
  const latest = await CreditNote.findOne({
    where: { cn_code: { [Op.like]: `${prefix}%` } },
    order: [["cn_code", "DESC"]],
  });
  const next = latest ? parseInt(latest.cn_code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export const listCreditNotes = async (
  store_id: number | null,
  params: { page?: number; limit?: number; search?: string; outlet_id?: number | null } = {}
) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (store_id !== null)      where["store_id"]  = store_id;
  if (params.outlet_id != null) where["outlet_id"] = params.outlet_id;
  if (params.search)          where["cn_code"]   = { [Op.like]: `%${params.search}%` };

  const { rows, count } = await CreditNote.findAndCountAll({
    where,
    include: [
      { model: Return, as: "return", attributes: ["id", "code"] },
      { model: Admin,  as: "createdBy", attributes: ["id", "fname", "lname"] },
    ],
    order: [["created_ts", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return { rows, count };
};

const detailIncludes = [
  { model: Return,  as: "return",    attributes: ["id", "code", "cn_amount", "payment_done"] },
  { model: Admin,   as: "createdBy", attributes: ["id", "fname", "lname"] },
  { model: Outlet,  as: "outlet",    attributes: ["id", "name"] },
  { model: Vendor,  as: "vendor",    attributes: ["id", "company_name"] },
];

export const getCreditNote = async (id: number, store_id: number | null) => {
  const where: Record<string, unknown> = { id };
  if (store_id !== null) where["store_id"] = store_id;

  const cn = await CreditNote.findOne({ where, include: detailIncludes });
  if (!cn) throw notFound();
  return cn;
};

export const getCreditNoteByReturnId = async (return_id: number, store_id: number | null) => {
  const where: Record<string, unknown> = { return_id };
  if (store_id !== null) where["store_id"] = store_id;

  const cn = await CreditNote.findOne({ where, include: detailIncludes });
  if (!cn) throw notFound();
  return cn;
};

export const createCreditNote = async (
  store_id: number,
  admin_id: number,
  dto: CreateCreditNoteDto
) => {
  const ret = await Return.findOne({ where: { id: dto.return_id, store_id } });
  if (!ret) throw returnNotFound();

  const cn_code = await generateCode();

  const cn = await CreditNote.create({
    cn_code,
    return_id:     dto.return_id,
    store_id,
    outlet_id:     dto.outlet_id ?? null,
    vendor_id:     ret.vendor_id ?? null,
    grn_code:      dto.grn_code,
    purchase_code: dto.purchase_code,
    payment_id:    null,
    created_by:    admin_id,
  });

  return { id: cn.id, cn_code: cn.cn_code };
};
