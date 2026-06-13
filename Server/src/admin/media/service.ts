import { Media } from "../../models/index";

export const listMedia = async (storeId: number | null) => {
  const where: Record<string, unknown> = {};
  if (storeId !== null) where["store_id"] = storeId;
  return Media.findAll({ where, order: [["created_ts", "DESC"]] });
};

export const createMedia = async (data: {
  filename: string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  store_id: number | null;
}) => {
  return Media.create(data);
};
