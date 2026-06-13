import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CityAttributes {
  id: number;
  name: string;
  state_id: number;
  status: boolean;
  created_ts?: Date;
}

type CityCreationAttributes = Optional<CityAttributes, "id" | "status">;

class City extends Model<CityAttributes, CityCreationAttributes> implements CityAttributes {
  declare id: number;
  declare name: string;
  declare state_id: number;
  declare status: boolean;
  declare created_ts: Date;
}

City.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    state_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "states", key: "id" },
    },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "cities", createdAt: "created_ts", updatedAt: false }
);

export default City;
