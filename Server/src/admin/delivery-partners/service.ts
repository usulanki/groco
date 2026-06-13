import { DeliveryPartner, StoreFeatureFlag } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";

export const listDeliveryPartners = async () => {
  const rows = await DeliveryPartner.findAll({
    where: { is_deleted: false },
    order: [["name", "ASC"]],
  });
  return rows.map(r => r.toJSON());
};

export const toggleDeliveryPartnerStatus = async (id: number) => {
  const partner = await DeliveryPartner.findOne({ where: { id, is_deleted: false } });
  if (!partner) throw Object.assign(new Error("Delivery partner not found"), { statusCode: 404 }) as AppError;
  await partner.update({ status: !partner.status });
  return partner.toJSON();
};

export const getFeatureFlag = async (storeId: number, feature: string) => {
  const flag = await StoreFeatureFlag.findOne({ where: { store_id: storeId, feature } });
  // default to enabled if no row yet
  return { enabled: flag ? flag.enabled : true };
};

export const setFeatureFlag = async (storeId: number, feature: string, enabled: boolean) => {
  const [flag] = await StoreFeatureFlag.findOrCreate({
    where:    { store_id: storeId, feature },
    defaults: { store_id: storeId, feature, enabled },
  });
  if (flag.enabled !== enabled) await flag.update({ enabled });
  return { enabled: flag.enabled };
};
