import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface TaxAttributes {
  id: number;
  name: string;
  value: number;
  store_id: number;
  is_deleted: boolean;
  status: boolean;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type TaxCreationAttributes = Optional<TaxAttributes, "id" | "is_deleted" | "status" | "deleted_by">;

class Tax extends Model<TaxAttributes, TaxCreationAttributes> implements TaxAttributes {
  declare id: number;
  declare name: string;
  declare value: number;
  declare store_id: number;
  declare is_deleted: boolean;
  declare status: boolean;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Tax.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "taxes",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default Tax;
