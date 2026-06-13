import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type DiscountType = "flat" | "percentage";

interface DiscountAttributes {
  id: number;
  code: string;
  name: string | null;
  description: string | null;
  type: DiscountType;
  value: number;
  min_order_amount: number | null;
  max_discount_cap: number | null;
  usage_limit: number | null;
  usage_per_user: number | null;
  valid_from: Date | null;
  valid_to: Date | null;
  is_first_order: boolean;
  free_shipping: boolean;
  stackable: boolean;
  auto_apply: boolean;
  exclude_sale: boolean;
  store_id: number;
  status: boolean;
  is_deleted: boolean;
  created_ts?: Date;
  updated_ts?: Date;
}

type DiscountCreationAttributes = Optional<
  DiscountAttributes,
  | "id" | "name" | "description" | "min_order_amount" | "max_discount_cap"
  | "usage_limit" | "usage_per_user" | "valid_from" | "valid_to"
  | "is_first_order" | "free_shipping" | "stackable" | "auto_apply" | "exclude_sale"
  | "status" | "is_deleted"
>;

class Discount extends Model<DiscountAttributes, DiscountCreationAttributes> implements DiscountAttributes {
  declare id: number;
  declare code: string;
  declare name: string | null;
  declare description: string | null;
  declare type: DiscountType;
  declare value: number;
  declare min_order_amount: number | null;
  declare max_discount_cap: number | null;
  declare usage_limit: number | null;
  declare usage_per_user: number | null;
  declare valid_from: Date | null;
  declare valid_to: Date | null;
  declare is_first_order: boolean;
  declare free_shipping: boolean;
  declare stackable: boolean;
  declare auto_apply: boolean;
  declare exclude_sale: boolean;
  declare store_id: number;
  declare status: boolean;
  declare is_deleted: boolean;
  declare created_ts: Date;
  declare updated_ts: Date;
}

Discount.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    description: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    type: { type: DataTypes.ENUM("flat", "percentage"), allowNull: false },
    value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    min_order_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
    max_discount_cap: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
    usage_limit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    usage_per_user: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    valid_from: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    valid_to: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    is_first_order: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    free_shipping: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    stackable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    auto_apply: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    exclude_sale: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
    tableName: "discounts",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default Discount;
