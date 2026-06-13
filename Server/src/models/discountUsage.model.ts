import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface DiscountUsageAttributes {
  id: number;
  discount_id: number;
  user_id: number;
  order_id: number;
  discount_amount: number;
  used_at: Date;
}

type DiscountUsageCreationAttributes = Optional<DiscountUsageAttributes, "id" | "used_at">;

class DiscountUsage extends Model<DiscountUsageAttributes, DiscountUsageCreationAttributes> implements DiscountUsageAttributes {
  declare id: number;
  declare discount_id: number;
  declare user_id: number;
  declare order_id: number;
  declare discount_amount: number;
  declare used_at: Date;
}

DiscountUsage.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    discount_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "discounts", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "orders", key: "id" },
    },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "discount_usages",
    timestamps: false,
  }
);

export default DiscountUsage;
