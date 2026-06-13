import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  id: number;
  code?: string | null;
  fname: string;
  lname: string;
  email: string;
  password: string | null;
  google_id?: string | null;
  facebook_id?: string | null;
  apple_id?: string | null;
  phone?: string | null;
  joined_on?: Date;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  otp?: string | null;
  otp_expiry?: Date | null;
  is_deleted: boolean;
  status: boolean;
  deleted_by?: number | null;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "is_email_verified" | "is_phone_verified" | "is_deleted" | "status" | "deleted_by" | "google_id" | "facebook_id" | "apple_id"
>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare code: string | null;
  declare fname: string;
  declare lname: string;
  declare email: string;
  declare password: string | null;
  declare google_id: string | null;
  declare facebook_id: string | null;
  declare apple_id: string | null;
  declare phone: string | null;
  declare joined_on: Date;
  declare is_email_verified: boolean;
  declare is_phone_verified: boolean;
  declare otp: string | null;
  declare otp_expiry: Date | null;
  declare is_deleted: boolean;
  declare status: boolean;
  declare deleted_by: number | null;
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: true },
    fname: { type: DataTypes.STRING, allowNull: false },
    lname: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: true },
    google_id: { type: DataTypes.STRING(255), allowNull: true },
    facebook_id: { type: DataTypes.STRING(255), allowNull: true },
    apple_id: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    joined_on: { type: DataTypes.DATE },
    is_email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_phone_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    otp: { type: DataTypes.STRING(10), allowNull: true },
    otp_expiry: { type: DataTypes.DATE, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "users",
    createdAt: "joined_on",
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["email"], name: "users_email_unique" },
    ],
  }
);

export default User;
