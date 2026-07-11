import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type DocumentType = 'aadhar' | 'pan' | 'driving_licence' | 'passport' | 'voter_id';

interface DeliveryAgentAttributes {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string;
  password: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  document_type: DocumentType | null;
  document_no: string | null;
  contact_person: string | null;
  contact_person_number: string | null;
  store_id: number | null;
  outlet_id: number | null;
  status: boolean;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type DeliveryAgentCreationAttributes = Optional<DeliveryAgentAttributes, 'id' | 'status' | 'is_deleted'>;

class DeliveryAgent extends Model<DeliveryAgentAttributes, DeliveryAgentCreationAttributes>
  implements DeliveryAgentAttributes {
  declare id: number;
  declare first_name: string;
  declare last_name: string;
  declare email: string | null;
  declare mobile: string;
  declare password: string | null;
  declare address1: string | null;
  declare address2: string | null;
  declare city: string | null;
  declare state: string | null;
  declare pincode: string | null;
  declare document_type: DocumentType | null;
  declare document_no: string | null;
  declare contact_person: string | null;
  declare contact_person_number: string | null;
  declare store_id: number | null;
  declare outlet_id: number | null;
  declare status: boolean;
  declare is_deleted: boolean;
  declare deleted_at: Date | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

DeliveryAgent.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    first_name:  { type: DataTypes.STRING(100), allowNull: false },
    last_name:   { type: DataTypes.STRING(100), allowNull: false },
    email:       { type: DataTypes.STRING(255), allowNull: true },
    mobile:      { type: DataTypes.STRING(20),  allowNull: false },
    password:    { type: DataTypes.STRING(255), allowNull: true },
    address1:    { type: DataTypes.STRING(255), allowNull: true },
    address2:    { type: DataTypes.STRING(255), allowNull: true },
    city:        { type: DataTypes.STRING(100), allowNull: true },
    state:       { type: DataTypes.STRING(100), allowNull: true },
    pincode:     { type: DataTypes.STRING(10),  allowNull: true },
    document_type: {
      type: DataTypes.ENUM('aadhar', 'pan', 'driving_licence', 'passport', 'voter_id'),
      allowNull: true,
    },
    document_no:           { type: DataTypes.STRING(50),  allowNull: true },
    contact_person:        { type: DataTypes.STRING(100),    allowNull: true },
    contact_person_number: { type: DataTypes.STRING(20),     allowNull: true },
    store_id:              { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    outlet_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status:     { type: DataTypes.BOOLEAN,  allowNull: false, defaultValue: true },
    is_deleted: { type: DataTypes.BOOLEAN,  allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE,     allowNull: true,  defaultValue: null },
    created_ts: { type: DataTypes.DATE },
    updated_ts: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'delivery_partner',
    createdAt: 'created_ts',
    updatedAt: 'updated_ts',
  }
);

export default DeliveryAgent;
