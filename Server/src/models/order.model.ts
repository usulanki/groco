import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type OrderStatus  = "order_placed" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentMode  = "cod" | "online" | "wallet" | "card" | "upi";

interface OrderAttributes {
  id: number;
  user_id: number;
  address_id: number | null;
  store_id: number;
  outlet_id: number;
  order_no: string;
  order_status: OrderStatus;
  tax: number;
  order_amount: number;
  discount_amount: number;
  delivery_charge: number;
  invoice_no: string | null;
  source: string;
  total: number;
  payment_mode: PaymentMode;
  payment_reference: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type OrderCreationAttributes = Optional<
  OrderAttributes,
  "id" | "order_status" | "invoice_no" | "address_id" | "discount_amount" | "delivery_charge" | "payment_reference" | "notes" | "latitude" | "longitude"
>;

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: number;
  declare user_id: number;
  declare address_id: number | null;
  declare store_id: number;
  declare outlet_id: number;
  declare order_no: string;
  declare order_status: OrderStatus;
  declare tax: number;
  declare order_amount: number;
  declare discount_amount: number;
  declare delivery_charge: number;
  declare invoice_no: string | null;
  declare source: string;
  declare total: number;
  declare payment_mode: PaymentMode;
  declare payment_reference: string | null;
  declare notes: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Order.init(
  {
    id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    address_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    store_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    outlet_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    order_no:     { type: DataTypes.STRING(50), allowNull: false },
    order_status: {
      type: DataTypes.ENUM("order_placed", "pending", "confirmed", "shipped", "delivered", "cancelled"),
      defaultValue: "pending",
    },
    tax:              { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    order_amount:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount_amount:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    delivery_charge:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    invoice_no:       { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
    source:           { type: DataTypes.STRING(50), allowNull: false, defaultValue: "ADMIN" },
    total:            { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_mode: {
      type: DataTypes.ENUM("cod", "online", "wallet", "card", "upi"),
      allowNull: false,
      defaultValue: "cod",
    },
    payment_reference: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    notes:             { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    latitude:          { type: DataTypes.DECIMAL(10, 7), allowNull: true, defaultValue: null },
    longitude:         { type: DataTypes.DECIMAL(10, 7), allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "orders",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
    indexes: [
      { unique: true, fields: ["order_no"], name: "orders_order_no_unique" },
    ],
  }
);

export default Order;
