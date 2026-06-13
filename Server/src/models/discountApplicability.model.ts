import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type ApplicabilityType = "product" | "category" | "sku" | "user" | "customer_group";

interface DiscountApplicabilityAttributes {
  id: number;
  discount_id: number;
  type: ApplicabilityType;
  ref_id: number;
}

type DiscountApplicabilityCreationAttributes = Optional<DiscountApplicabilityAttributes, "id">;

class DiscountApplicability extends Model<DiscountApplicabilityAttributes, DiscountApplicabilityCreationAttributes> implements DiscountApplicabilityAttributes {
  declare id: number;
  declare discount_id: number;
  declare type: ApplicabilityType;
  declare ref_id: number;
}

DiscountApplicability.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    discount_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "discounts", key: "id" },
    },
    type: { type: DataTypes.ENUM("product", "category", "sku", "user", "customer_group"), allowNull: false },
    ref_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    sequelize,
    tableName: "discount_applicability",
    timestamps: false,
  }
);

export default DiscountApplicability;
