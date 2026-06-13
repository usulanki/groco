import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ConfigItemAttributes {
  id: number;
  config_id: number;
  value: string;
  store_id: number | null;
  status: number;
  is_deleted: number;
  created_ts?: Date;
  updated_ts?: Date;
}

type ConfigItemCreationAttributes = Optional<ConfigItemAttributes, "id" | "store_id" | "status" | "is_deleted">;

class ConfigItem extends Model<ConfigItemAttributes, ConfigItemCreationAttributes> implements ConfigItemAttributes {
  declare id: number;
  declare config_id: number;
  declare value: string;
  declare store_id: number | null;
  declare status: number;
  declare is_deleted: number;
  declare created_ts: Date;
  declare updated_ts: Date;
}

ConfigItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    config_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "configs", key: "id" },
    },
    value: { type: DataTypes.STRING(100), allowNull: false },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "stores", key: "id" },
    },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    is_deleted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "config_items",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default ConfigItem;
