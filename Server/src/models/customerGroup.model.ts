import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CustomerGroupAttributes {
  id: number;
  code: string;
  name: string;
  store_id: number;
  is_deleted: boolean;
  status: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type CustomerGroupCreationAttributes = Optional<CustomerGroupAttributes, "id" | "is_deleted" | "status">;

class CustomerGroup extends Model<CustomerGroupAttributes, CustomerGroupCreationAttributes> implements CustomerGroupAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare store_id: number;
  declare is_deleted: boolean;
  declare status: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

CustomerGroup.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: "customer_groups",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default CustomerGroup;
