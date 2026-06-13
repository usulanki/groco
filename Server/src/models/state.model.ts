import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface StateAttributes {
  id: number;
  name: string;
  status: boolean;
  created_ts?: Date;
}

type StateCreationAttributes = Optional<StateAttributes, "id" | "status">;

class State extends Model<StateAttributes, StateCreationAttributes> implements StateAttributes {
  declare id: number;
  declare name: string;
  declare status: boolean;
  declare created_ts: Date;
}

State.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "states", createdAt: "created_ts", updatedAt: false }
);

export default State;
