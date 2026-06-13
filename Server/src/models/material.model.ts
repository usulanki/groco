import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface MaterialAttributes {
  id: number;
  store_id: number;
  code: string;
  name: string;
  value: string;
  uom_id: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  hsn_code: string | null;
  price: number | null;
  short_desc: string | null;
  allow_inventory: boolean;
  is_deleted: boolean;
  status: boolean;
  created_by: number | null;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type MaterialCreationAttributes = Optional<
  MaterialAttributes,
  "id" | "uom_id" | "category_id" | "subcategory_id" | "hsn_code" | "price" | "short_desc" | "allow_inventory" | "is_deleted" | "status" | "created_by" | "deleted_by"
>;

class Material extends Model<MaterialAttributes, MaterialCreationAttributes>
  implements MaterialAttributes {
  declare id: number;
  declare store_id: number;
  declare code: string;
  declare name: string;
  declare value: string;
  declare uom_id: number | null;
  declare category_id: number | null;
  declare subcategory_id: number | null;
  declare hsn_code: string | null;
  declare price: number | null;
  declare short_desc: string | null;
  declare allow_inventory: boolean;
  declare is_deleted: boolean;
  declare status: boolean;
  declare created_by: number | null;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Material.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    value: { type: DataTypes.STRING(100), allowNull: false },
    uom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "uom", key: "id" },
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "categories", key: "id" },
    },
    subcategory_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "categories", key: "id" },
    },
    hsn_code:        { type: DataTypes.STRING(20),     allowNull: true },
    price:           { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    short_desc:      { type: DataTypes.TEXT,           allowNull: true },
    allow_inventory: { type: DataTypes.BOOLEAN,    allowNull: false, defaultValue: false },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "materials",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default Material;
