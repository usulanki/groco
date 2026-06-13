import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface MenuAttributes {
  id: number;
  name: string;
  link?: string | null;
  parent_id?: number | null;
  sort_order?: number | null;
  status: boolean;
  icon?: string | null;
  scope?: string | null;
  show_in_sidebar?: boolean;
}

type MenuCreationAttributes = Optional<MenuAttributes, "id" | "status">;

class Menu extends Model<MenuAttributes, MenuCreationAttributes> implements MenuAttributes {
  declare id: number;
  declare name: string;
  declare link: string | null;
  declare parent_id: number | null;
  declare sort_order: number | null;
  declare status: boolean;
  declare icon: string | null;
  declare scope: string | null;
  declare show_in_sidebar: boolean;
}

Menu.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    link: { type: DataTypes.STRING, allowNull: true },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "menus", key: "id" },
    },
    sort_order: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    icon: { type: DataTypes.STRING, allowNull: true },
    scope: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "SUPERADMIN,ADMIN" },
    show_in_sidebar: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: "menus",
    createdAt: false,
    updatedAt: false,
  }
);

export default Menu;
