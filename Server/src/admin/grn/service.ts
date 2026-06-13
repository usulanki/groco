import { Op } from "sequelize";
import Grn from "../../models/grn.model";
import Purchase from "../../models/purchase.model";
import Vendor from "../../models/vendor.model";
import Admin from "../../models/admin.model";
import type { ListGrnsParams, GrnSortBy, GrnSortOrder } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

const notFound = (): AppError =>
  Object.assign(new Error("GRN not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listGrns = async (store_id: number | null, params: ListGrnsParams = {}) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const grnWhere: Record<string, unknown> = {};
  if (params.is_partial !== undefined) grnWhere["is_partial"] = params.is_partial;
  if (params.outlet_id != null)        grnWhere["outlet_id"]  = params.outlet_id;
  if (params.search) {
    // Search by GRN code directly; purchase code search is handled via subQuery: false + col reference
    grnWhere[Op.or as unknown as string] = [
      { code: { [Op.like]: `%${params.search}%` } },
      { "$Purchase.code$": { [Op.like]: `%${params.search}%` } },
    ];
  }

  const purchaseWhere: Record<string, unknown> = { ...storeScope(store_id) };
  if (params.vendor_id) purchaseWhere["vendor_id"] = params.vendor_id;

  const sortBy: GrnSortBy       = params.sort_by    ?? "created_ts";
  const sortOrder: GrnSortOrder = params.sort_order ?? "DESC";

  const { rows, count } = await Grn.findAndCountAll({
    where: grnWhere,
    include: [
      {
        model: Purchase,
        attributes: ["id", "code", "store_id", "vendor_id", "pr_state", "order_date"],
        where: purchaseWhere,
        include: [
          { model: Vendor, as: "Vendor", attributes: ["id", "company_name"] },
        ],
      },
      { model: Admin, as: "CreatedBy", attributes: ["id", "fname", "lname"] },
      // Partial GRNs linked to this full GRN
      {
        model: Grn,
        as: "partialGrns",
        attributes: ["id", "code", "created_date", "created_ts"],
        required: false,
      },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return { rows, count };
};

export const getGrn = async (id: number, store_id: number | null) => {
  const grn = await Grn.findOne({
    where: { id },
    include: [
      {
        model: Purchase,
        attributes: ["id", "code", "store_id", "vendor_id", "pr_state", "order_date"],
        where: storeScope(store_id),
        include: [
          { model: Vendor, as: "Vendor", attributes: ["id", "company_name"] },
        ],
      },
      { model: Admin, as: "CreatedBy", attributes: ["id", "fname", "lname"] },
      {
        model: Grn,
        as: "partialGrns",
        attributes: ["id", "code", "created_date", "created_ts", "is_partial"],
        required: false,
      },
      {
        model: Grn,
        as: "fullGrn",
        attributes: ["id", "code", "created_date", "created_ts"],
        required: false,
      },
    ],
  });
  if (!grn) throw notFound();
  return grn;
};
