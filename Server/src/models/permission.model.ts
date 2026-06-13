import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface PermissionAttributes {
  id: number;
  menu_id: number;
  role_id: number;
  store_id?: number | null;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  upload: boolean;
  download: boolean;
}

type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  "id" | "view" | "add" | "edit" | "delete" | "upload" | "download"
>;

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: number;
  declare menu_id: number;
  declare role_id: number;
  declare store_id: number | null;
  declare view: boolean;
  declare add: boolean;
  declare edit: boolean;
  declare delete: boolean;
  declare upload: boolean;
  declare download: boolean;
}

Permission.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    menu_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "menus", key: "id" },
    },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "stores", key: "id" },
    },
    view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    add: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    edit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    delete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    upload: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    download: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "permissions",
    createdAt: false,
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["menu_id", "role_id", "store_id"] },
    ],
  }
);

export default Permission;
