import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductVariantAttributes {
  id: number;
  product_id: number;
  sku: string;
  sku_group: string | null;
  barcode: string;
  status: boolean;
  is_deleted: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type ProductVariantCreationAttributes = Optional<ProductVariantAttributes, "id" | "sku_group" | "status" | "is_deleted">;

class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> implements ProductVariantAttributes {
  declare id: number;
  declare product_id: number;
  declare sku: string;
  declare sku_group: string | null;
  declare barcode: string;
  declare status: boolean;
  declare is_deleted: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

ProductVariant.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    sku: { type: DataTypes.STRING, allowNull: false },
    sku_group: { type: DataTypes.STRING(10), allowNull: true, defaultValue: null },
    barcode: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "product_variants",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
    indexes: [
      { name: "uq_product_variants_sku", unique: true, fields: ["sku"] },
      { name: "uq_product_variants_barcode", unique: true, fields: ["barcode"] },
    ],
  }
);

export default ProductVariant;
