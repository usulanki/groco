import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type BrandType = "global" | "custom";

interface BrandAttributes {
  id: number;
  store_id: number | null;
  name: string;
  slug: string;
  type: BrandType;
  is_deleted: boolean;
  status: boolean;
  created_by: number | null;
  deleted_by?: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type BrandCreationAttributes = Optional<
  BrandAttributes,
  "id" | "store_id" | "is_deleted" | "status" | "created_by" | "deleted_by"
>;

class Brand extends Model<BrandAttributes, BrandCreationAttributes> implements BrandAttributes {
  declare id: number;
  declare store_id: number | null;
  declare name: string;
  declare slug: string;
  declare type: BrandType;
  declare is_deleted: boolean;
  declare status: boolean;
  declare created_by: number | null;
  declare deleted_by: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Brand.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "stores", key: "id" },
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    type: { type: DataTypes.ENUM("global", "custom"), allowNull: false, defaultValue: "custom" },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    tableName: "brands",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  },
);

export default Brand;
