import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface NotificationSettingAttributes {
  id: number;
  admin_id: number;
  key: string;
  enabled: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type NotificationSettingCreationAttributes = Optional<NotificationSettingAttributes, "id" | "enabled">;

class NotificationSetting
  extends Model<NotificationSettingAttributes, NotificationSettingCreationAttributes>
  implements NotificationSettingAttributes
{
  declare id: number;
  declare admin_id: number;
  declare key: string;
  declare enabled: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

NotificationSetting.init(
  {
    id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: "admins", key: "id" } },
    key:      { type: DataTypes.STRING(100),      allowNull: false },
    enabled:  { type: DataTypes.BOOLEAN,          allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: "notification_settings",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default NotificationSetting;
