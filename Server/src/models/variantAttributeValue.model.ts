import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface VariantAttributeValueAttributes {
  id: number;
  attribute_id: number;
  value: string;
  sort_order: number;
  created_ts?: Date;
  updated_ts?: Date;
}

type VariantAttributeValueCreationAttributes = Optional<VariantAttributeValueAttributes, "id" | "sort_order">;

class VariantAttributeValue extends Model<VariantAttributeValueAttributes, VariantAttributeValueCreationAttributes> implements VariantAttributeValueAttributes {
  declare id: number;
  declare attribute_id: number;
  declare value: string;
  declare sort_order: number;
  declare created_ts: Date;
  declare updated_ts: Date;
}

VariantAttributeValue.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    attribute_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "variant_attributes", key: "id" },
    },
    value: { type: DataTypes.STRING, allowNull: false },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "variant_attribute_values",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default VariantAttributeValue;
