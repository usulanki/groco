import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface PurchaseAttributes {
  id: number;
  store_id: number;
  outlet_id?: number | null;
  vendor_id?: number | null;
  code: string;
  invoice_ref_id?: number | null;
  pr_state: "ORDERED" | "PARTIAL_GRN" | "GRN_DONE" | "CANCELLED";
  order_date?: string | null;
  status: boolean;
  created_by?: number | null;
  created_ts?: Date;
  grn_date?: string | null;
  grn_by?: number | null;
}

type PurchaseCreationAttributes = Optional<PurchaseAttributes, "id" | "pr_state" | "status" | "outlet_id">;

class Purchase extends Model<PurchaseAttributes, PurchaseCreationAttributes> implements PurchaseAttributes {
  declare id: number;
  declare store_id: number;
  declare outlet_id: number | null;
  declare vendor_id: number | null;
  declare code: string;
  declare invoice_ref_id: number | null;
  declare pr_state: "ORDERED" | "PARTIAL_GRN" | "GRN_DONE" | "CANCELLED";
  declare order_date: string | null;
  declare status: boolean;
  declare created_by: number | null;
  declare created_ts: Date;
  declare grn_date: string | null;
  declare grn_by: number | null;
}

Purchase.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "outlets", key: "id" },
    },
    vendor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "vendors", key: "id" },
    },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    invoice_ref_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "invoices", key: "id" },
    },
    pr_state: {
      type: DataTypes.ENUM("ORDERED", "PARTIAL_GRN", "GRN_DONE", "CANCELLED"),
      allowNull: false,
      defaultValue: "ORDERED",
    },
    order_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    created_ts: { type: DataTypes.DATE, field: "created_ts" },
    grn_date: { type: DataTypes.DATEONLY, allowNull: true },
    grn_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "purchases",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Purchase;
