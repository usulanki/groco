import { Product, ProductReturnPolicy, ConfigItem } from "../../models/index";

const notFoundError = () =>
  Object.assign(new Error("Product not found"), { statusCode: 404 });

export const getReturnPolicy = async (product_id: number) => {
  return ProductReturnPolicy.findAll({
    where: { product_id },
    include: [{ model: ConfigItem, as: "configItem", attributes: ["id", "value"] }],
  });
};

export const saveReturnPolicy = async (product_id: number, config_item_ids: number[]) => {
  const product = await Product.findOne({ where: { id: product_id, is_deleted: false } });
  if (!product) throw notFoundError();

  // Delete existing entries for this product
  await ProductReturnPolicy.destroy({ where: { product_id } });

  if (config_item_ids.length === 0) return [];

  // Fetch config item values to denormalize
  const configItems = await ConfigItem.findAll({
    where: { id: config_item_ids, status: 1, is_deleted: 0 },
  });

  const rows = configItems.map((ci) => ({
    product_id,
    config_item_id: ci.id,
    value: ci.value,
  }));

  await ProductReturnPolicy.bulkCreate(rows);

  return ProductReturnPolicy.findAll({
    where: { product_id },
    include: [{ model: ConfigItem, as: "configItem", attributes: ["id", "value"] }],
  });
};
