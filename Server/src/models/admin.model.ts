import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface AdminAttributes {
  id: number;
  fname: string;
  lname: string;
  email: string;
  username: string;
  password: string;
  role_id: number;
  store_id?: number | null;
  outlet_id?: number | null;
  created_by?: number | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  pincode?: string | null;
  city?: string | null;
  country?: string | null;
  is_deleted: boolean;
  is_active: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type AdminCreationAttributes = Optional<AdminAttributes, "id" | "is_deleted" | "is_active">;

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  declare id: number;
  declare fname: string;
  declare lname: string;
  declare email: string;
  declare username: string;
  declare password: string;
  declare role_id: number;
  declare store_id: number | null;
  declare outlet_id: number | null;
  declare created_by: number | null;
  declare phone: string | null;
  declare address1: string | null;
  declare address2: string | null;
  declare pincode: string | null;
  declare city: string | null;
  declare country: string | null;
  declare is_deleted: boolean;
  declare is_active: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Admin.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    fname: { type: DataTypes.STRING, allowNull: false },
    lname: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "stores", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "outlets", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    phone: { type: DataTypes.STRING, allowNull: true },
    address1: { type: DataTypes.STRING, allowNull: true },
    address2: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_ts: { type: DataTypes.DATE, field: "created_ts" },
    updated_ts: { type: DataTypes.DATE, field: "updated_ts" },
  },
  {
    sequelize,
    tableName: "admins",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
    indexes: [
      { unique: true, fields: ["email"], name: "admins_email_unique" },
      { unique: true, fields: ["username"], name: "admins_username_unique" },
      { unique: true, fields: ["phone"], name: "admins_phone_unique" },
    ],
  }
);

export default Admin;
