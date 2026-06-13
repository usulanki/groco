import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductInventoryAttributes {
  id: number;
  product_id: number | null;
  material_id: number | null;
  variant_id: number | null;
  store_id: number;
  outlet_id: number;
  sku: string;
  saleable_qty: number;
  non_saleable_qty: number;
  low_stock_threshold: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type ProductInventoryCreationAttributes = Optional<
  ProductInventoryAttributes,
  "id" | "product_id" | "material_id" | "variant_id" | "saleable_qty" | "non_saleable_qty" | "low_stock_threshold"
>;

class ProductInventory extends Model<ProductInventoryAttributes, ProductInventoryCreationAttributes> implements ProductInventoryAttributes {
  declare id: number;
  declare product_id: number | null;
  declare material_id: number | null;
  declare variant_id: number | null;
  declare store_id: number;
  declare outlet_id: number;
  declare sku: string;
  declare saleable_qty: number;
  declare non_saleable_qty: number;
  declare low_stock_threshold: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;

  get total_qty(): number {
    return this.saleable_qty + this.non_saleable_qty;
  }
}

ProductInventory.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "products", key: "id" },
    },
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "materials", key: "id" },
    },
    variant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "product_variants", key: "id" },
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "outlets", key: "id" },
    },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    saleable_qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    non_saleable_qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    low_stock_threshold: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "inventory",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default ProductInventory;
