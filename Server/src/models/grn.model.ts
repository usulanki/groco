import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface GrnAttributes {
  id: number;
  code: string;
  purchase_id: number;
  outlet_id?: number | null;
  created_date?: string | null;
  is_partial: boolean;
  is_return_done: boolean;
  status: boolean;
  created_ts?: Date;
  created_by?: number | null;
  /** Set on partial GRN records when a subsequent full GRN is done for the same purchase.
   *  Allows the full GRN detail view to list all linked partial GRNs. */
  full_grn_id?: number | null;
}

type GrnCreationAttributes = Optional<GrnAttributes, "id" | "created_date" | "status" | "created_by" | "full_grn_id" | "outlet_id">;

class Grn extends Model<GrnAttributes, GrnCreationAttributes> implements GrnAttributes {
  declare id: number;
  declare code: string;
  declare purchase_id: number;
  declare outlet_id: number | null;
  declare created_date: string | null;
  declare is_partial: boolean;
  declare is_return_done: boolean;
  declare status: boolean;
  declare created_ts: Date;
  declare created_by: number | null;
  declare full_grn_id: number | null;
}

Grn.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    purchase_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "purchases", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "outlets", key: "id" },
    },
    created_date: { type: DataTypes.DATEONLY, allowNull: true },
    is_partial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_return_done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    created_ts: { type: DataTypes.DATE },
    full_grn_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "grns", key: "id" },
      comment: "Set on partial GRN records when a full GRN is completed for the same purchase",
    },
  },
  {
    sequelize,
    tableName: "grns",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Grn;
