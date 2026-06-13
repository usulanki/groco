import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface StoreFeatureFlagAttributes {
  id:         number;
  store_id:   number;
  feature:    string;
  enabled:    boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type StoreFeatureFlagCreationAttributes = Optional<StoreFeatureFlagAttributes, "id" | "enabled">;

class StoreFeatureFlag extends Model<StoreFeatureFlagAttributes, StoreFeatureFlagCreationAttributes>
  implements StoreFeatureFlagAttributes {
  declare id:         number;
  declare store_id:   number;
  declare feature:    string;
  declare enabled:    boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

StoreFeatureFlag.init(
  {
    id:        { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    store_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    feature:   { type: DataTypes.STRING(50),       allowNull: false },
    enabled:   { type: DataTypes.BOOLEAN,          allowNull: false, defaultValue: true },
    created_ts:{ type: DataTypes.DATE },
    updated_ts:{ type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "store_feature_flags",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default StoreFeatureFlag;
