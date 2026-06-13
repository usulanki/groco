import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ReturnLineItemAttributes {
  id: number;
  return_id: number;
  purchase_item_id: number | null;
  store_id: number;
  vendor_id: number | null;
  outlet_id: number | null;
  type: "P" | "M";
  ref_id: number;
  variant_id: number | null;
  sku: string | null;
  qty: number;
  item_price: number;
  amount: number;
}

type ReturnLineItemCreationAttributes = Optional<ReturnLineItemAttributes, "id" | "purchase_item_id" | "vendor_id" | "outlet_id" | "variant_id" | "sku">;

class ReturnLineItem extends Model<ReturnLineItemAttributes, ReturnLineItemCreationAttributes>
  implements ReturnLineItemAttributes {
  declare id: number;
  declare return_id: number;
  declare purchase_item_id: number | null;
  declare store_id: number;
  declare vendor_id: number | null;
  declare outlet_id: number | null;
  declare type: "P" | "M";
  declare ref_id: number;
  declare variant_id: number | null;
  declare sku: string | null;
  declare qty: number;
  declare item_price: number;
  declare amount: number;
}

ReturnLineItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    return_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "returns", key: "id" },
    },
    purchase_item_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "purchase_items", key: "id" },
      onDelete: "SET NULL",
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    vendor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "vendors", key: "id" },
    },
    outlet_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "outlets", key: "id" },
    },
    type: { type: DataTypes.ENUM("P", "M"), allowNull: false },
    ref_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    sku: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    item_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    sequelize,
    tableName: "return_line_items",
    timestamps: false,
  }
);

export default ReturnLineItem;
