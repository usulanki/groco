import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface VariantAttributeAttributes {
  id: number;
  name: string;
  store_id: number;
  status: boolean;
  is_deleted: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type VariantAttributeCreationAttributes = Optional<VariantAttributeAttributes, "id" | "status" | "is_deleted">;

class VariantAttribute extends Model<VariantAttributeAttributes, VariantAttributeCreationAttributes> implements VariantAttributeAttributes {
  declare id: number;
  declare name: string;
  declare store_id: number;
  declare status: boolean;
  declare is_deleted: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

VariantAttribute.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "variant_attributes",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default VariantAttribute;
