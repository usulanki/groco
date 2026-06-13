import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductMediaAttributes {
  id: number;
  product_id: number;
  media_id: number;
  variant_id: number;
  sort_order: number;
  is_primary: boolean;
}

type ProductMediaCreationAttributes = Optional<ProductMediaAttributes, "id" | "sort_order" | "is_primary">;

class ProductMedia extends Model<ProductMediaAttributes, ProductMediaCreationAttributes> implements ProductMediaAttributes {
  declare id: number;
  declare product_id: number;
  declare media_id: number;
  declare variant_id: number;
  declare sort_order: number;
  declare is_primary: boolean;
}

ProductMedia.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    media_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "media", key: "id" },
    },
    variant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "product_variants", key: "id" },
    },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "product_media",
    timestamps: false,
  }
);

export default ProductMedia;
