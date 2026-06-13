import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class OrderHistory extends Model {
  declare id: number;
  declare order_id: number;
  declare action: string;
  declare performed_by: string | null;
  declare admin_id: number | null;
  declare created_ts: Date;
}

OrderHistory.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    order_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    action:       { type: DataTypes.STRING(500),      allowNull: false },
    performed_by: { type: DataTypes.STRING(150),      allowNull: true },
    admin_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_ts:   { type: DataTypes.DATE,             allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "order_history",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default OrderHistory;
