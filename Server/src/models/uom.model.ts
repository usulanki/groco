import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface UomAttributes {
  id: number;
  store_id: number;
  name: string;
  short_name: string;
  is_deleted: boolean;
  status: boolean;
  created_by: number | null;
  deleted_by?: number | null;
  created_ts?: Date;
}

type UomCreationAttributes = Optional<UomAttributes, "id" | "is_deleted" | "status" | "created_by" | "deleted_by">;

class Uom extends Model<UomAttributes, UomCreationAttributes> implements UomAttributes {
  declare id: number;
  declare store_id: number;
  declare name: string;
  declare short_name: string;
  declare is_deleted: boolean;
  declare status: boolean;
  declare created_by: number | null;
  declare deleted_by: number | null;
  declare created_ts: Date;
}

Uom.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    short_name: { type: DataTypes.STRING(20), allowNull: false },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "uom",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Uom;
