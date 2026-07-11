import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type PayoutStatus = "pending" | "completed" | "rejected";

interface PayoutAttributes {
  id: number;
  delivery_agent_id: number;
  amount: number;
  status: PayoutStatus;
  notes: string | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type PayoutCreationAttributes = Optional<PayoutAttributes, "id" | "status" | "notes">;

class DeliveryAgentPayout
  extends Model<PayoutAttributes, PayoutCreationAttributes>
  implements PayoutAttributes {
  declare id: number;
  declare delivery_agent_id: number;
  declare amount: number;
  declare status: PayoutStatus;
  declare notes: string | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

DeliveryAgentPayout.init(
  {
    id:                { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    delivery_agent_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount:            { type: DataTypes.DECIMAL(10, 2),   allowNull: false },
    status:            {
      type: DataTypes.ENUM("pending", "completed", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    notes:      { type: DataTypes.TEXT,  allowNull: true,  defaultValue: null },
    created_ts: { type: DataTypes.DATE },
    updated_ts: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "delivery_agent_payouts",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default DeliveryAgentPayout;
