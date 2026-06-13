import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price: number;
  tax: number;
  total: number;
  is_deleted: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type OrderItemCreationAttributes = Optional<OrderItemAttributes, "id" | "variant_id" | "tax" | "is_deleted">;

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  declare id: number;
  declare order_id: number;
  declare product_id: number;
  declare variant_id: number | null;
  declare quantity: number;
  declare price: number;
  declare tax: number;
  declare total: number;
  declare is_deleted: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

OrderItem.init(
  {
    id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    quantity:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    price:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tax:        { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: "order_items", createdAt: "created_ts", updatedAt: "updated_ts" }
);

export default OrderItem;
