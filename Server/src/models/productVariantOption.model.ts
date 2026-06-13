import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductVariantOptionAttributes {
  id: number;
  variant_id: number;
  attribute_value_id: number;
}

type ProductVariantOptionCreationAttributes = Optional<ProductVariantOptionAttributes, "id">;

class ProductVariantOption extends Model<ProductVariantOptionAttributes, ProductVariantOptionCreationAttributes> implements ProductVariantOptionAttributes {
  declare id: number;
  declare variant_id: number;
  declare attribute_value_id: number;
}

ProductVariantOption.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    variant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "product_variants", key: "id" },
    },
    attribute_value_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "variant_attribute_values", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "product_variant_options",
    timestamps: false,
    indexes: [{ unique: true, fields: ["variant_id", "attribute_value_id"] }],
  }
);

export default ProductVariantOption;
