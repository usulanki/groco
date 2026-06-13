import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductPriceAttributes {
  id: number;
  product_id: number;
  variant_id: number | null;
  price: number;
  compare_at_price: number | null;
  final_price: number | null;
  customer_group_id: number | null;
  outlet_id: number | null;
  min_qty: number;
  max_qty: number | null;
  valid_from: Date | null;
  valid_to: Date | null;
  priority: number;
  status: boolean;
  is_deleted: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type ProductPriceCreationAttributes = Optional<
  ProductPriceAttributes,
  | "id" | "variant_id" | "compare_at_price" | "final_price" | "customer_group_id" | "outlet_id"
  | "min_qty" | "max_qty" | "valid_from" | "valid_to" | "priority" | "status" | "is_deleted"
>;

class ProductPrice extends Model<ProductPriceAttributes, ProductPriceCreationAttributes> implements ProductPriceAttributes {
  declare id: number;
  declare product_id: number;
  declare variant_id: number | null;
  declare price: number;
  declare compare_at_price: number | null;
  declare final_price: number | null;
  declare customer_group_id: number | null;
  declare outlet_id: number | null;
  declare min_qty: number;
  declare max_qty: number | null;
  declare valid_from: Date | null;
  declare valid_to: Date | null;
  declare priority: number;
  declare status: boolean;
  declare is_deleted: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

ProductPrice.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    variant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "product_variants", key: "id" },
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    compare_at_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
    final_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
    customer_group_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "customer_groups", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "outlets", key: "id" },
    },
    min_qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    max_qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    valid_from: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    valid_to: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "product_prices",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default ProductPrice;
