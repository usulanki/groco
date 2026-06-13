import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type PaymentMethod = "card" | "paypal";
export type PaymentStatus = "pending" | "success" | "failed";

interface PaymentAttributes {
  id: number;
  order_id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_ts?: Date;
  updated_ts?: Date;
}

type PaymentCreationAttributes = Optional<PaymentAttributes, "id" | "status">;

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: number;
  declare order_id: number;
  declare method: PaymentMethod;
  declare status: PaymentStatus;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    method: { type: DataTypes.ENUM("card", "paypal"), allowNull: false },
    status: { type: DataTypes.ENUM("pending", "success", "failed"), defaultValue: "pending" },
  },
  { sequelize, tableName: "payments", createdAt: "created_ts", updatedAt: "updated_ts" }
);

export default Payment;
