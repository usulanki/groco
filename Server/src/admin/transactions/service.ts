import { Op } from "sequelize";
import Transaction from "../../models/transaction.model";
import Admin from "../../models/admin.model";
import type { ListTransactionsParams, TransactionSortBy, TransactionSortOrder } from "./types";

export const listTransactions = async (store_id: number | null, params: ListTransactionsParams = {}) => {
  const page   = Math.max(1, params.page  ?? 1);
  const limit  = Math.max(1, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (store_id !== null) where["store_id"] = store_id;
  if (params.type) where["type"] = params.type;

  if (params.search) {
    where[Op.or as unknown as string] = [
      { code: { [Op.like]: `%${params.search}%` } },
      { name: { [Op.like]: `%${params.search}%` } },
    ];
  }

  const sortBy: TransactionSortBy       = params.sort_by    ?? "created_ts";
  const sortOrder: TransactionSortOrder = params.sort_order ?? "DESC";

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [
      {
        model: Admin,
        as: "createdBy",
        attributes: ["id", "fname", "lname"],
        required: false,
      },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
    distinct: true,
  });

  return { rows, count };
};
