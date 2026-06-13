import { Op } from "sequelize";
import { Config, ConfigItem } from "../../models/index";

export const getConfigItemsByCode = async (code: string, storeId: number | null) => {
  const config = await Config.findOne({ where: { code } });
  if (!config) return [];

  const storeWhere = storeId !== null
    ? { [Op.or]: [{ store_id: storeId }, { store_id: null }] }
    : { store_id: null };

  return ConfigItem.findAll({
    where: {
      config_id: config.id,
      ...storeWhere,
      status: 1,
      is_deleted: 0,
    },
    order: [["value", "ASC"]],
  });
};
