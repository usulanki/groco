import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CategoryAttributes {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  media_id: number | null;
  store_id: number | null;
  outlet_id: number | null;
  status: boolean;
  is_deleted: boolean;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type CategoryCreationAttributes = Optional<CategoryAttributes, "id" | "parent_id" | "media_id" | "store_id" | "outlet_id" | "status" | "is_deleted" | "deleted_by">;

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare parent_id: number | null;
  declare media_id: number | null;
  declare store_id: number | null;
  declare outlet_id: number | null;
  declare status: boolean;
  declare is_deleted: boolean;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Category.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    parent_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    media_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "stores", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "outlets", key: "id" },
    },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "categories",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
    indexes: [
      { unique: true, fields: ["slug"], name: "categories_slug_unique" },
    ],
  }
);

export default Category;
