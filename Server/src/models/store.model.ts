import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface StoreAttributes {
  id: number;
  name: string;
  owner_id?: number | null;
  is_deleted: boolean;
  status: boolean;
  max_admin: number;
  max_role: number;
  created_ts?: Date;
  created_by?: number | null;
}

type StoreCreationAttributes = Optional<StoreAttributes, "id" | "is_deleted" | "status" | "max_admin" | "max_role">;

class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
  declare id: number;
  declare name: string;
  declare owner_id: number | null;
  declare is_deleted: boolean;
  declare status: boolean;
  declare max_admin: number;
  declare max_role: number;
  declare created_ts: Date;
  declare created_by: number | null;
}

Store.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    owner_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    max_admin: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    max_role: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    created_ts: { type: DataTypes.DATE, field: "created_ts" },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "stores",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Store;
