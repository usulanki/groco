import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductAttributes {
  id: number;
  product_code: string;
  name: string;
  description: string;
  short_description: string | null;
  category_id: number;
  store_id: number | null;
  is_stockable: boolean;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  seo_tags: string[] | null;
  gender?: string | null;
  hsn_code?: string | null;
  tax_id?: number | null;
  brand_id?: number | null;
  return_timeline: number | null;
  return_allowed: boolean;
  max_cart: number | null;
  status: boolean;
  is_draft: boolean;
  is_deleted: boolean;
  created_by: number;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  "id" | "store_id" | "gender" | "hsn_code" | "tax_id" | "brand_id" | "short_description" | "is_stockable" | "slug" | "meta_title" | "meta_description" | "seo_tags" | "return_timeline" | "return_allowed" | "max_cart" | "status" | "is_draft" | "is_deleted" | "deleted_by"
>;

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare product_code: string;
  declare name: string;
  declare description: string;
  declare short_description: string | null;
  declare category_id: number;
  declare store_id: number | null;
  declare is_stockable: boolean;
  declare slug: string;
  declare meta_title: string | null;
  declare meta_description: string | null;
  declare seo_tags: string[] | null;
  declare gender: string | null;
  declare hsn_code: string | null;
  declare tax_id: number | null;
  declare brand_id: number | null;
  declare return_timeline: number | null;
  declare return_allowed: boolean;
  declare max_cart: number | null;
  declare status: boolean;
  declare is_draft: boolean;
  declare is_deleted: boolean;
  declare created_by: number;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_code: { type: DataTypes.STRING(20), allowNull: false, unique: "products_product_code_unique" },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    short_description: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "categories", key: "id" },
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "stores", key: "id" },
    },
    is_stockable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: "products_slug_unique" },
    meta_title: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    meta_description: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    seo_tags: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    gender: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },
    hsn_code: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
    tax_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "taxes", key: "id" },
    },
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "brands", key: "id" },
    },
    return_timeline: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    return_allowed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    max_cart: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_draft: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "admins", key: "id" },
    },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  { sequelize, tableName: "products", createdAt: "created_ts", updatedAt: "updated_ts" }
);

export default Product;
