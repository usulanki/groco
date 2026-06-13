import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface PurchaseItemAttributes {
  id: number;
  purchase_id: number;
  type: "P" | "M";
  ref_id: number;
  variant_id: number | null;
  sku: string | null;
  qty: number;
  item_price: number;
  amount: number;
  tax_amount: number;
  total: number;
  is_grn_done: boolean;
}

type PurchaseItemCreationAttributes = Optional<PurchaseItemAttributes, "id" | "variant_id" | "sku" | "tax_amount" | "is_grn_done">;

class PurchaseItem extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes> implements PurchaseItemAttributes {
  declare id: number;
  declare purchase_id: number;
  declare type: "P" | "M";
  declare ref_id: number;
  declare variant_id: number | null;
  declare sku: string | null;
  declare qty: number;
  declare item_price: number;
  declare amount: number;
  declare tax_amount: number;
  declare total: number;
  declare is_grn_done: boolean;
}

PurchaseItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    purchase_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "purchases", key: "id" },
    },
    type: {
      type: DataTypes.ENUM("P", "M"),
      allowNull: false,
    },
    ref_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    sku: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    item_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    tax_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    is_grn_done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: "purchase_items",
    timestamps: false,
  }
);

export default PurchaseItem;
