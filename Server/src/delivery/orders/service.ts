import { Op } from "sequelize";
import Order from "../../models/order.model";
import Outlet from "../../models/outlet.model";
import User from "../../models/user.model";
import Address from "../../models/address.model";
import OrderItem from "../../models/orderItem.model";
import Product from "../../models/product.model";
import type { AppError } from "../../shared/middleware/error.middleware";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ACTIVE_STATUSES = ["confirmed"];

export const getActiveOrders = async (
  agentStoreId:  number | null,
  agentOutletId: number | null,
  lat?: number,
  lng?: number,
) => {
  let outletIds: number[];

  if (agentOutletId) {
    outletIds = [agentOutletId];

  } else if (agentStoreId) {
    const outlets = await Outlet.findAll({
      where: { store_id: agentStoreId, is_deleted: false, status: true },
      attributes: ["id"],
    });
    outletIds = outlets.map(o => o.id);

  } else {
    const outlets = await Outlet.findAll({
      where: { is_deleted: false, status: true },
      attributes: ["id", "latitude", "longitude", "serviceable_distance_km"],
    });

    outletIds = outlets
      .filter(o => {
        if (o.latitude == null || o.longitude == null) return true;
        if (lat == null || lng == null) return true;
        return haversineKm(lat, lng, Number(o.latitude), Number(o.longitude)) <= o.serviceable_distance_km;
      })
      .map(o => o.id);
  }

  if (outletIds.length === 0) return [];

  const orders = await Order.findAll({
    where: {
      outlet_id:    { [Op.in]: outletIds },
      order_status: { [Op.in]: ACTIVE_STATUSES },
    },
    include: [
      { model: Outlet, attributes: ["id", "name", "address1", "city"] },
    ],
    order: [["created_ts", "DESC"]],
    limit: 50,
  });

  return orders.map(o => o.toJSON());
};

// ── Accept order (confirmed → shipped) ────────────────────────────────────────

export const acceptOrder = async (orderId: number) => {
  const order = await Order.findOne({ where: { id: orderId, order_status: "confirmed" } });
  if (!order) {
    throw Object.assign(
      new Error("Order not found or no longer available"),
      { statusCode: 404 }
    ) as AppError;
  }
  await order.update({ order_status: "shipped" });
  return { id: order.id, order_no: order.order_no, order_status: "shipped" };
};

// ── Get full order detail for active delivery ─────────────────────────────────

export const getOrderDetail = async (orderId: number) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: Outlet,
        attributes: ["id", "name", "address1", "address2", "city", "state", "pincode"],
      },
      {
        model: User,
        attributes: ["id", "fname", "lname", "phone"],
      },
      {
        model: Address,
        attributes: ["id", "address1", "address2", "pincode"],
      },
      {
        model: OrderItem,
        where: { is_deleted: false },
        required: false,
        include: [
          { model: Product, attributes: ["id", "name"] },
        ],
      },
    ],
  });

  if (!order) {
    throw Object.assign(new Error("Order not found"), { statusCode: 404 }) as AppError;
  }
  return order.toJSON();
};

// ── Mark order as delivered (shipped → delivered) ─────────────────────────────

export const deliverOrder = async (orderId: number) => {
  const order = await Order.findOne({ where: { id: orderId, order_status: "shipped" } });
  if (!order) {
    throw Object.assign(
      new Error("Order not found or not currently in delivery"),
      { statusCode: 404 }
    ) as AppError;
  }
  await order.update({ order_status: "delivered" });
};

// ── List delivered orders for the agent's outlet(s) within a date range ────────

export const getDeliveredOrders = async (
  agentStoreId:  number | null,
  agentOutletId: number | null,
  from: Date,
  to: Date,
) => {
  let outletIds: number[];

  if (agentOutletId) {
    outletIds = [agentOutletId];
  } else if (agentStoreId) {
    const outlets = await Outlet.findAll({
      where: { store_id: agentStoreId, is_deleted: false },
      attributes: ["id"],
    });
    outletIds = outlets.map(o => o.id);
  } else {
    const outlets = await Outlet.findAll({ where: { is_deleted: false }, attributes: ["id"] });
    outletIds = outlets.map(o => o.id);
  }

  if (outletIds.length === 0) return [];

  const orders = await Order.findAll({
    where: {
      outlet_id:    { [Op.in]: outletIds },
      order_status: "delivered",
      updated_ts:   { [Op.between]: [from, to] },
    },
    include: [
      { model: Outlet, attributes: ["id", "name"] },
      { model: User,   attributes: ["id", "fname", "lname", "phone"] },
    ],
    order: [["updated_ts", "DESC"]],
    limit: 200,
  });

  return orders.map(o => o.toJSON());
};
