import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface DeliveryPartnerAttributes {
  id:          number;
  name:        string;
  slug:        string;
  logo_url:    string | null;
  description: string | null;
  status:      boolean;
  is_deleted:  boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type DeliveryPartnerCreationAttributes = Optional<DeliveryPartnerAttributes, "id" | "status" | "is_deleted">;

class DeliveryPartner extends Model<DeliveryPartnerAttributes, DeliveryPartnerCreationAttributes>
  implements DeliveryPartnerAttributes {
  declare id:          number;
  declare name:        string;
  declare slug:        string;
  declare logo_url:    string | null;
  declare description: string | null;
  declare status:      boolean;
  declare is_deleted:  boolean;
  declare created_ts:  Date;
  declare updated_ts:  Date;
}

DeliveryPartner.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name:        { type: DataTypes.STRING(100), allowNull: false },
    slug:        { type: DataTypes.STRING(50),  allowNull: false, unique: true },
    logo_url:    { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_ts:  { type: DataTypes.DATE },
    updated_ts:  { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName:  "delivery_partners",
    createdAt:  "created_ts",
    updatedAt:  "updated_ts",
  }
);

export default DeliveryPartner;
