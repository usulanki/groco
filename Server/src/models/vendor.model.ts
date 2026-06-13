import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface VendorAttributes {
  id: number;
  store_id: number | null;
  vendor_code: string;
  company_name: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone: string;
  owner_address?: string | null;
  gst_no?: string | null;
  status: boolean;
  is_deleted: boolean;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type VendorCreationAttributes = Optional<VendorAttributes, "id" | "vendor_code" | "status" | "is_deleted" | "deleted_by">;

class Vendor extends Model<VendorAttributes, VendorCreationAttributes> implements VendorAttributes {
  declare id: number;
  declare store_id: number | null;
  declare vendor_code: string;
  declare company_name: string;
  declare owner_name: string;
  declare owner_email: string | null;
  declare owner_phone: string;
  declare owner_address: string | null;
  declare gst_no: string | null;
  declare status: boolean;
  declare is_deleted: boolean;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Vendor.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "stores", key: "id" },
    },
    vendor_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    company_name: { type: DataTypes.STRING, allowNull: false },
    owner_name:   { type: DataTypes.STRING, allowNull: false },
    owner_email:  { type: DataTypes.STRING, allowNull: true },
    owner_phone:  { type: DataTypes.STRING, allowNull: false },
    owner_address:{ type: DataTypes.STRING(500), allowNull: true },
    gst_no:       { type: DataTypes.STRING, allowNull: true },
    status:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_by:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_ts:   { type: DataTypes.DATE },
    updated_ts:   { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "vendors",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default Vendor;
