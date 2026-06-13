import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ConfigAttributes {
  id: number;
  code: string;
  store_id: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type ConfigCreationAttributes = Optional<ConfigAttributes, "id" | "store_id">;

class Config extends Model<ConfigAttributes, ConfigCreationAttributes> implements ConfigAttributes {
  declare id: number;
  declare code: string;
  declare store_id: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Config.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: "stores", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "configs",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default Config;
