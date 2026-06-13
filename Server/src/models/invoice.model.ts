import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface InvoiceAttributes {
  id: number;
  store_id: number;
  invoice_no: string;
  module: string;
  created_by: number | null;
  created_ts?: Date;
}

type InvoiceCreationAttributes = Optional<InvoiceAttributes, "id" | "created_by">;

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes>
  implements InvoiceAttributes {
  declare id: number;
  declare store_id: number;
  declare invoice_no: string;
  declare module: string;
  declare created_by: number | null;
  declare created_ts: Date;
}

Invoice.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    invoice_no: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    module: { type: DataTypes.STRING(50), allowNull: false },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "invoices",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Invoice;
