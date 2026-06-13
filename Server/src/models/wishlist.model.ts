import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface WishlistAttributes {
  id: number;
  user_id: number;
  product_id: number;
  is_deleted: boolean;
  created_ts?: Date;
}

type WishlistCreationAttributes = Optional<WishlistAttributes, "id" | "is_deleted">;

class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
  declare id: number;
  declare user_id: number;
  declare product_id: number;
  declare is_deleted: boolean;
  declare created_ts: Date;
}

Wishlist.init(
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
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "wishlists", createdAt: "created_ts", updatedAt: false }
);

export default Wishlist;
