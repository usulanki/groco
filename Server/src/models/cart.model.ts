import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CartAttributes {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  is_removed: boolean;
  created_ts?: Date;
}

type CartCreationAttributes = Optional<CartAttributes, "id" | "is_removed">;

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  declare id: number;
  declare user_id: number;
  declare product_id: number;
  declare quantity: number;
  declare is_removed: boolean;
  declare created_ts: Date;
}

Cart.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    is_removed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "carts", createdAt: "created_ts", updatedAt: false }
);

export default Cart;
