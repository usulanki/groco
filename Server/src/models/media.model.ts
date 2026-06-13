import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface MediaAttributes {
  id: number;
  filename: string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  store_id: number | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type MediaCreationAttributes = Optional<MediaAttributes, "id" | "store_id">;

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  declare id: number;
  declare filename: string;
  declare original_name: string;
  declare path: string;
  declare mime_type: string;
  declare size: number;
  declare store_id: number | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Media.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    filename: { type: DataTypes.STRING, allowNull: false },
    original_name: { type: DataTypes.STRING, allowNull: false },
    path: { type: DataTypes.STRING, allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    store_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  },
  { sequelize, tableName: "media", createdAt: "created_ts", updatedAt: "updated_ts" }
);

export default Media;
