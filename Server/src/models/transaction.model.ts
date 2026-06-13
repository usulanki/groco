import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type TransactionType        = "VENDOR" | "CUSTOMER";
export type TransactionChannel     = "ADMIN" | "WEBSITE" | "IOS_APP" | "ANDROID_APP";
export type TransactionPaymentType = "Paid" | "Received" | "Adjust";

interface TransactionAttributes {
  id: number;
  store_id: number;
  outlet_id: number | null;
  vendor_id: number | null;
  type: TransactionType;
  payment_type: TransactionPaymentType;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  channel: TransactionChannel;
  payment_mode: string;
  ref_no: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_ts?: Date;
  created_by: number | null;
}

type TransactionCreationAttributes = Optional<
  TransactionAttributes,
  "id" | "outlet_id" | "vendor_id" | "phone" | "email" | "channel" | "payment_type" | "ref_no" | "notes" | "created_by"
>;

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes {
  declare id: number;
  declare store_id: number;
  declare outlet_id: number | null;
  declare vendor_id: number | null;
  declare type: TransactionType;
  declare payment_type: TransactionPaymentType;
  declare code: string;
  declare name: string;
  declare phone: string | null;
  declare email: string | null;
  declare channel: TransactionChannel;
  declare payment_mode: string;
  declare ref_no: string | null;
  declare amount: number;
  declare payment_date: string;
  declare notes: string | null;
  declare created_ts: Date;
  declare created_by: number | null;
}

Transaction.init(
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
    type: {
      type: DataTypes.ENUM("VENDOR", "CUSTOMER"),
      allowNull: false,
    },
    payment_type: {
      type: DataTypes.ENUM("Paid", "Received", "Adjust"),
      allowNull: false,
      defaultValue: "Paid",
    },
    code: { type: DataTypes.STRING(25), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    channel: {
      type: DataTypes.ENUM("ADMIN", "WEBSITE", "IOS_APP", "ANDROID_APP"),
      allowNull: false,
      defaultValue: "ADMIN",
    },
    payment_mode: { type: DataTypes.STRING(50), allowNull: false },
    ref_no: { type: DataTypes.STRING(100), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payment_date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "transactions",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Transaction;
