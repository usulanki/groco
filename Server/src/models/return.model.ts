import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type ReturnType = "PURCHASE_RETURN" | "ORDER_RETURN";

interface ReturnAttributes {
  id: number;
  type: ReturnType;
  code: string;
  store_id: number;
  outlet_id: number | null;
  grn_id: number | null;
  payment_done: boolean;
  cn_amount: number;
  vendor_id: number | null;
  created_ts?: Date;
  created_by?: number | null;
}

type ReturnCreationAttributes = Optional<
  ReturnAttributes,
  "id" | "payment_done" | "outlet_id" | "grn_id" | "vendor_id" | "created_by"
>;

class Return extends Model<ReturnAttributes, ReturnCreationAttributes>
  implements ReturnAttributes {
  declare id: number;
  declare type: ReturnType;
  declare code: string;
  declare store_id: number;
  declare outlet_id: number | null;
  declare grn_id: number | null;
  declare payment_done: boolean;
  declare cn_amount: number;
  declare vendor_id: number | null;
  declare created_ts: Date;
  declare created_by: number | null;
}

Return.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    type: {
      type: DataTypes.ENUM("PURCHASE_RETURN", "ORDER_RETURN"),
      allowNull: false,
    },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
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
    grn_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "grns", key: "id" },
      onDelete: "SET NULL",
    },
    payment_done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    cn_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    vendor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "vendors", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    created_ts: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "returns",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Return;
