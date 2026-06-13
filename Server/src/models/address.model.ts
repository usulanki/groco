import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface AddressAttributes {
  id: number;
  user_id: number;
  address1: string;
  address2?: string | null;
  city_id: number;
  state_id: number;
  pincode: string;
  status: boolean;
  created_ts?: Date;
}

type AddressCreationAttributes = Optional<AddressAttributes, "id" | "status">;

class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  declare id: number;
  declare user_id: number;
  declare address1: string;
  declare address2: string | null;
  declare city_id: number;
  declare state_id: number;
  declare pincode: string;
  declare status: boolean;
  declare created_ts: Date;
}

Address.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    address1: { type: DataTypes.STRING, allowNull: false },
    address2: { type: DataTypes.STRING, allowNull: true },
    city_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "cities", key: "id" },
    },
    state_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "states", key: "id" },
    },
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "addresses", createdAt: "created_ts", updatedAt: false }
);

export default Address;
