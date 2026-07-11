import { Op, QueryTypes } from "sequelize";
import sequelize from "../../config/database";
import Order from "../../models/order.model";
import Outlet from "../../models/outlet.model";
import DeliveryAgentPayout from "../../models/deliveryAgentPayout.model";
import type { AppError } from "../../shared/middleware/error.middleware";

async function agentOutletIds(storeId: number | null, outletId: number | null): Promise<number[]> {
  if (outletId) return [outletId];
  if (storeId) {
    const outlets = await Outlet.findAll({ where: { store_id: storeId, is_deleted: false }, attributes: ["id"] });
    return outlets.map(o => o.id);
  }
  const outlets = await Outlet.findAll({ where: { is_deleted: false }, attributes: ["id"] });
  return outlets.map(o => o.id);
}

export const getWalletSummary = async (agentId: number, storeId: number | null, outletId: number | null) => {
  const outletIds = await agentOutletIds(storeId, outletId);

  let totalEarned = 0;
  if (outletIds.length) {
    const rows = await sequelize.query<{ total: string }>(
      `SELECT COALESCE(SUM(delivery_charge), 0) AS total
       FROM orders
       WHERE outlet_id IN (:outletIds) AND order_status = 'delivered'`,
      { replacements: { outletIds }, type: QueryTypes.SELECT }
    );
    totalEarned = parseFloat(rows[0]?.total ?? "0");
  }

  const paidRows = await sequelize.query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM delivery_agent_payouts
     WHERE delivery_agent_id = :agentId AND status = 'completed'`,
    { replacements: { agentId }, type: QueryTypes.SELECT }
  );
  const totalPaidOut = parseFloat(paidRows[0]?.total ?? "0");

  return {
    total_earned:      Math.round(totalEarned  * 100) / 100,
    total_paid_out:    Math.round(totalPaidOut * 100) / 100,
    available_balance: Math.round((totalEarned - totalPaidOut) * 100) / 100,
  };
};

export const requestPayout = async (agentId: number, amount: number) => {
  const MIN_PAYOUT = 300;

  if (amount < MIN_PAYOUT) {
    throw Object.assign(
      new Error(`Minimum payout amount is ₹${MIN_PAYOUT}`),
      { statusCode: 400 }
    ) as AppError;
  }

  const { available_balance } = await getWalletSummary(agentId, null, null);
  if (amount > available_balance) {
    throw Object.assign(
      new Error(`Amount exceeds available balance of ₹${available_balance.toFixed(2)}`),
      { statusCode: 400 }
    ) as AppError;
  }

  const pending = await DeliveryAgentPayout.findOne({
    where: { delivery_agent_id: agentId, status: "pending" },
  });
  if (pending) {
    throw Object.assign(
      new Error("You already have a pending payout request"),
      { statusCode: 409 }
    ) as AppError;
  }

  const payout = await DeliveryAgentPayout.create({ delivery_agent_id: agentId, amount });
  return payout.toJSON();
};

export const listPayouts = async (agentId: number) => {
  const payouts = await DeliveryAgentPayout.findAll({
    where: { delivery_agent_id: agentId },
    order: [["created_ts", "DESC"]],
    limit: 50,
  });
  return payouts.map(p => p.toJSON());
};
