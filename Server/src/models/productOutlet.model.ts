import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductOutletAttributes {
  id: number;
  product_id: number;
  outlet_id: number;
}

type ProductOutletCreationAttributes = Optional<ProductOutletAttributes, "id">;

class ProductOutlet extends Model<ProductOutletAttributes, ProductOutletCreationAttributes> implements ProductOutletAttributes {
  declare id: number;
  declare product_id: number;
  declare outlet_id: number;
}

ProductOutlet.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "outlets", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "product_outlets",
    timestamps: false,
    indexes: [{ unique: true, fields: ["product_id", "outlet_id"] }],
  }
);

export default ProductOutlet;
