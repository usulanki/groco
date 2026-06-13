import { Op, type WhereOptions } from "sequelize";
import { Vendor, Product, Material, User, Category, Tax, Uom, Admin } from "../../models/index";

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function storeWhere(storeId: number | null, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    is_deleted: true,
    updated_ts: { [Op.gte]: thirtyDaysAgo() },
  };
  if (storeId !== null) base["store_id"] = storeId;
  return { ...base, ...extra };
}

type ExtraFields = Record<string, string | number | boolean | null>;

function toItem(raw: Record<string, unknown>, name: string, deletedByName: string | null = null, extra?: ExtraFields) {
  return { id: raw["id"], name, deleted_ts: raw["updated_ts"], deleted_by: deletedByName, ...(extra ? { extra } : {}) };
}

export const getTrashData = async (storeId: number | null) => {
  const [vendorRows, productRows, materialRows, customerRows, categoryRows, taxRows, uomRows] =
    await Promise.all([
      Vendor.findAll({
        where: storeWhere(storeId),
        attributes: ["id", "company_name", "owner_name", "owner_email", "owner_phone", "gst_no", "status", "updated_ts", "deleted_by"],
      }),
      Product.findAll({
        where: storeWhere(storeId),
        attributes: ["id", "name", "product_code", "status", "is_draft", "updated_ts", "deleted_by"],
      }),
      Material.findAll({
        where: storeWhere(storeId),
        attributes: ["id", "name", "code", "value", "hsn_code", "price", "status", "updated_ts", "deleted_by"],
      }),
      // User has no updated_ts column (updatedAt: false) — filter by is_deleted only
      User.findAll({
        where: { is_deleted: true } as WhereOptions,
        attributes: ["id", "fname", "lname", "email", "phone", "code", "joined_on", "deleted_by"],
      }),
      Category.findAll({
        where: {
          is_deleted: true,
          updated_ts: { [Op.gte]: thirtyDaysAgo() },
          ...(storeId !== null ? { store_id: storeId } : {}),
        } as WhereOptions,
        attributes: ["id", "name", "slug", "parent_id", "status", "updated_ts", "deleted_by"],
      }),
      Tax.findAll({
        where: storeWhere(storeId),
        attributes: ["id", "name", "value", "status", "updated_ts", "deleted_by"],
      }),
      // Uom has no updated_ts column (updatedAt: false) — filter by is_deleted only
      Uom.findAll({
        where: {
          is_deleted: true,
          ...(storeId !== null ? { store_id: storeId } : {}),
        } as WhereOptions,
        attributes: ["id", "name", "short_name", "status", "created_ts", "deleted_by"],
      }),
    ]);

  // Collect all unique non-null deleted_by IDs across all entity types
  const allRows = [
    ...vendorRows, ...productRows, ...materialRows, ...customerRows,
    ...categoryRows, ...taxRows, ...uomRows,
  ];
  const adminIds = [...new Set(
    allRows
      .map(r => (r.toJSON() as unknown as Record<string, unknown>)["deleted_by"] as number | null)
      .filter((id): id is number => id !== null && id !== undefined)
  )];

  // Fetch admin names for all relevant IDs
  const nameMap: Record<number, string> = {};
  if (adminIds.length > 0) {
    const admins = await Admin.findAll({
      where: { id: { [Op.in]: adminIds } },
      attributes: ["id", "fname", "lname"],
    });
    for (const a of admins) {
      const aj = a.toJSON() as unknown as Record<string, unknown>;
      nameMap[aj["id"] as number] = `${aj["fname"]} ${aj["lname"]}`;
    }
  }

  function getDeletedByName(j: Record<string, unknown>): string | null {
    const dbId = j["deleted_by"] as number | null | undefined;
    return dbId != null ? (nameMap[dbId] ?? null) : null;
  }

  return {
    vendors: vendorRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return toItem(j, String(j["company_name"]), getDeletedByName(j), {
        "Owner":  String(j["owner_name"]),
        "Phone":  String(j["owner_phone"]),
        "Email":  j["owner_email"] != null ? String(j["owner_email"]) : null,
        "GST No": j["gst_no"] != null ? String(j["gst_no"]) : null,
        "Status": j["status"] ? "Active" : "Inactive",
      });
    }),
    products: productRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return toItem(j, String(j["name"]), getDeletedByName(j), {
        "SKU":    String(j["product_code"]),
        "Status": j["status"] ? "Active" : "Inactive",
        "Draft":  j["is_draft"] ? "Yes" : "No",
      });
    }),
    materials: materialRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return toItem(j, String(j["name"]), getDeletedByName(j), {
        "Code":     String(j["code"]),
        "Value":    String(j["value"]),
        "HSN Code": j["hsn_code"] != null ? String(j["hsn_code"]) : null,
        "Price":    j["price"] != null ? Number(j["price"]) : null,
        "Status":   j["status"] ? "Active" : "Inactive",
      });
    }),
    customers: customerRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return {
        id: j["id"],
        name: `${j["fname"]} ${j["lname"]}`,
        deleted_ts: j["joined_on"],
        deleted_by: getDeletedByName(j),
        extra: {
          "Email":  String(j["email"]),
          "Phone":  j["phone"] != null ? String(j["phone"]) : null,
          "Code":   j["code"] != null ? String(j["code"]) : null,
        } as ExtraFields,
      };
    }),
    categories: categoryRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return toItem(j, String(j["name"]), getDeletedByName(j), {
        "Slug":   String(j["slug"]),
        "Type":   j["parent_id"] != null ? "Subcategory" : "Category",
        "Status": j["status"] ? "Active" : "Inactive",
      });
    }),
    taxes: taxRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return toItem(j, String(j["name"]), getDeletedByName(j), {
        "Rate":   `${j["value"]}%`,
        "Status": j["status"] ? "Active" : "Inactive",
      });
    }),
    uoms: uomRows.map(r => {
      const j = r.toJSON() as unknown as Record<string, unknown>;
      return {
        id: j["id"],
        name: String(j["name"]),
        deleted_ts: j["created_ts"],
        deleted_by: getDeletedByName(j),
        extra: {
          "Short Name": String(j["short_name"]),
          "Status":     j["status"] ? "Active" : "Inactive",
        } as ExtraFields,
      };
    }),
  };
};
