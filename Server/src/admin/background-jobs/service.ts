import { Op } from "sequelize";
import BackgroundJob from "../../models/backgroundJob.model";
import Admin from "../../models/admin.model";

export const listJobs = async (params: {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  adminId: number | null;       // null = superadmin sees all
  storeId: number | null;
}) => {
  const { page, limit, type, status } = params;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (type)   where.type   = type;
  if (status) where.status = status;
  // Non-superadmin admins only see their own jobs
  if (params.adminId !== null) where.admin_id = params.adminId;

  const { rows, count } = await BackgroundJob.findAndCountAll({
    where,
    include: [
      {
        model: Admin,
        attributes: ["id", "fname", "lname", "email"],
        as: "createdBy",
      },
    ],
    order: [["created_ts", "DESC"]],
    limit,
    offset,
  });

  return {
    rows: rows.map((j) => j.toJSON()),
    count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};
