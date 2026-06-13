import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface RoleAttributes {
  id: number;
  name: string;
  code: string;
  created_by?: number | null;
  store_id?: number | null;
  is_deleted: boolean;
  status: boolean;
  created_ts?: Date;
}

type RoleCreationAttributes = Optional<RoleAttributes, "id" | "is_deleted" | "status">;

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare created_by: number | null;
  declare store_id: number | null;
  declare is_deleted: boolean;
  declare status: boolean;
  declare created_ts: Date;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "stores", key: "id" },
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_ts: { type: DataTypes.DATE, field: "created_ts" },
  },
  {
    sequelize,
    tableName: "roles",
    createdAt: "created_ts",
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["code"], name: "roles_code_unique" },
    ],
  }
);

export default Role;
