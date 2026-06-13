import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductReturnPolicyAttributes {
  id: number;
  product_id: number;
  config_item_id: number;
  value: string;
  created_ts?: Date;
  updated_ts?: Date;
}

type ProductReturnPolicyCreationAttributes = Optional<ProductReturnPolicyAttributes, "id">;

class ProductReturnPolicy extends Model<ProductReturnPolicyAttributes, ProductReturnPolicyCreationAttributes>
  implements ProductReturnPolicyAttributes {
  declare id: number;
  declare product_id: number;
  declare config_item_id: number;
  declare value: string;
  declare created_ts: Date;
  declare updated_ts: Date;
}

ProductReturnPolicy.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    config_item_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "config_items", key: "id" },
    },
    value: { type: DataTypes.STRING(100), allowNull: false },
  },
  {
    sequelize,
    tableName: "product_return_policy",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default ProductReturnPolicy;
