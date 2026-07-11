import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export interface DaySlot {
  enabled: boolean;
  open: string;
  close: string;
}

export interface DeliverySlots {
  monday: DaySlot;
  tuesday: DaySlot;
  wednesday: DaySlot;
  thursday: DaySlot;
  friday: DaySlot;
  saturday: DaySlot;
  sunday: DaySlot;
}

interface OutletAttributes {
  id: number;
  name: string;
  store_id: number;
  manager_id?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  is_deleted: boolean;
  status: boolean;
  instant_delivery_enabled: boolean;
  slot_delivery_enabled: boolean;
  delivery_slots: DeliverySlots | null;
  serviceable_distance_km: number;
  delivery_charge_per_km: number;
  created_ts?: Date;
  created_by?: number | null;
}

type OutletCreationAttributes = Optional<OutletAttributes, "id" | "is_deleted" | "status" | "instant_delivery_enabled" | "slot_delivery_enabled" | "delivery_slots" | "serviceable_distance_km" | "delivery_charge_per_km">;

class Outlet extends Model<OutletAttributes, OutletCreationAttributes> implements OutletAttributes {
  declare id: number;
  declare name: string;
  declare store_id: number;
  declare manager_id: number | null;
  declare location: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare address1: string | null;
  declare address2: string | null;
  declare city: string | null;
  declare state: string | null;
  declare pincode: string | null;
  declare is_deleted: boolean;
  declare status: boolean;
  declare instant_delivery_enabled: boolean;
  declare slot_delivery_enabled: boolean;
  declare delivery_slots: DeliverySlots | null;
  declare serviceable_distance_km: number;
  declare delivery_charge_per_km: number;
  declare created_ts: Date;
  declare created_by: number | null;
}

Outlet.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "stores", key: "id" },
    },
    manager_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
    location: { type: DataTypes.STRING, allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    address1: { type: DataTypes.STRING, allowNull: true },
    address2: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    instant_delivery_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    slot_delivery_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    delivery_slots: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    serviceable_distance_km: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 5 },
    delivery_charge_per_km: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 10 },
    created_ts: { type: DataTypes.DATE, field: "created_ts" },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "admins", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "outlets",
    createdAt: "created_ts",
    updatedAt: false,
  }
);

export default Outlet;
