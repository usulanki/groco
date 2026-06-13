import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CreditNoteAttributes {
  id: number;
  cn_code: string;
  return_id: number;
  store_id: number;
  outlet_id: number | null;
  vendor_id: number | null;
  grn_code: string;
  purchase_code: string;
  payment_id: number | null;
  created_by: number | null;
  created_ts?: Date;
}

type CreditNoteCreationAttributes = Optional<
  CreditNoteAttributes,
  "id" | "outlet_id" | "vendor_id" | "payment_id" | "created_by"
>;

class CreditNote
  extends Model<CreditNoteAttributes, CreditNoteCreationAttributes>
  implements CreditNoteAttributes
{
  declare id: number;
  declare cn_code: string;
  declare return_id: number;
  declare store_id: number;
  declare outlet_id: number | null;
  declare vendor_id: number | null;
  declare grn_code: string;
  declare purchase_code: string;
  declare payment_id: number | null;
  declare created_by: number | null;
  declare created_ts: Date;
}

CreditNote.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cn_code: { type: DataTypes.STRING(25), allowNull: false, unique: true },
    return_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "returns", key: "id" },
    },
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
    grn_code: { type: DataTypes.STRING(25), allowNull: false },
    purchase_code: { type: DataTypes.STRING(25), allowNull: false },
    payment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "transactions", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "credit_notes",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default CreditNote;
