import { Op } from "sequelize";
import Discount from "../../models/discount.model";
import DiscountApplicability from "../../models/discountApplicability.model";
import DiscountUsage from "../../models/discountUsage.model";
import CustomerGroupMember from "../../models/customerGroupMember.model";
import Order from "../../models/order.model";
import { Cart } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateDiscountDto, UpdateDiscountDto } from "./types";

const notFoundError = (): AppError =>
  Object.assign(new Error("Discount not found"), { statusCode: 404 });

function storeScope(store_id: number | null): Record<string, unknown> {
  return store_id !== null ? { store_id } : {};
}

export const listDiscounts = async (
  page: number,
  limit: number,
  store_id: number | null,
  filters: { search?: string; statusFilter?: string; typeFilter?: string } = {},
) => {
  const now = new Date();
  const where: Record<string, unknown> = { is_deleted: false, ...storeScope(store_id) };

  if (filters.search) {
    where[Op.or as unknown as string] = [
      { code:        { [Op.like]: `%${filters.search}%` } },
      { name:        { [Op.like]: `%${filters.search}%` } },
      { description: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  if (filters.typeFilter && ["flat", "percentage"].includes(filters.typeFilter)) {
    where["type"] = filters.typeFilter;
  }

  if (filters.statusFilter === "active") {
    where["status"] = true;
    where[Op.and as unknown as string] = [
      { [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: now } }] },
      { [Op.or]: [{ valid_to:   null }, { valid_to:   { [Op.gte]: now } }] },
    ];
  } else if (filters.statusFilter === "inactive") {
    where["status"] = false;
  } else if (filters.statusFilter === "expired") {
    where["valid_to"] = { [Op.lt]: now };
  }

  const { rows, count } = await Discount.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [["created_ts", "DESC"]],
  });
  return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
};

export const getDiscountStats = async (store_id: number | null) => {
  const now = new Date();
  const base = { is_deleted: false, ...storeScope(store_id) };
  const [total, active, inactive, expired, savingsRows] = await Promise.all([
    Discount.count({ where: base }),
    Discount.count({ where: { ...base, status: true, [Op.and]: [
      { [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: now } }] },
      { [Op.or]: [{ valid_to:   null }, { valid_to:   { [Op.gte]: now } }] },
    ] } }),
    Discount.count({ where: { ...base, status: false } }),
    Discount.count({ where: { ...base, valid_to: { [Op.lt]: now } } }),
    DiscountUsage.findAll({
      attributes: [[Discount["sequelize"].fn("SUM", Discount["sequelize"].col("discount_amount")), "total_savings"]],
      include: [{ model: Discount, where: base, attributes: [] }],
      raw: true,
    }),
  ]);
  const totalSavings = parseFloat((savingsRows[0] as unknown as { total_savings: string })?.total_savings ?? "0") || 0;
  return { total, active, inactive, expired, total_savings: totalSavings };
};

export const getDiscountById = async (id: number, store_id: number | null) => {
  const discount = await Discount.findOne({
    where: { id, is_deleted: false, ...storeScope(store_id) },
    include: [{ model: DiscountApplicability, as: "applicability" }],
  });
  if (!discount) throw notFoundError();
  const usageCount = await DiscountUsage.count({ where: { discount_id: id } });
  return { ...discount.toJSON(), usage_count: usageCount };
};

export const createDiscount = async (data: CreateDiscountDto) => {
  const code = data.code.toUpperCase().replace(/\s+/g, "");
  const existing = await Discount.findOne({ where: { code, is_deleted: false } });
  if (existing) {
    throw Object.assign(new Error("A discount with this code already exists"), { statusCode: 409 });
  }

  const { applicability, ...rest } = data;
  const discount = await Discount.create({ ...rest, code });

  if (applicability && applicability.length > 0) {
    await DiscountApplicability.bulkCreate(
      applicability.map(a => ({ discount_id: discount.id, type: a.type, ref_id: a.ref_id }))
    );
  }

  return getDiscountById(discount.id, data.store_id);
};

export const updateDiscount = async (id: number, data: UpdateDiscountDto, store_id: number | null) => {
  const discount = await Discount.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!discount) throw notFoundError();

  const { applicability, ...rest } = data;
  await discount.update(rest);

  if (applicability !== undefined) {
    await DiscountApplicability.destroy({ where: { discount_id: id } });
    if (applicability.length > 0) {
      await DiscountApplicability.bulkCreate(
        applicability.map(a => ({ discount_id: id, type: a.type, ref_id: a.ref_id }))
      );
    }
  }

  return getDiscountById(id, store_id);
};

export const deleteDiscount = async (id: number, store_id: number | null): Promise<void> => {
  const discount = await Discount.findOne({ where: { id, is_deleted: false, ...storeScope(store_id) } });
  if (!discount) throw notFoundError();
  await discount.update({ is_deleted: true });
};

// ── Cart Validation ───────────────────────────────────────────────────────────

export const validateDiscountCode = async (params: {
  code: string;
  user_id: number;
  store_id: number;
  order_amount: number;
  product_ids: number[];
  category_ids: number[];
  variant_ids?: number[];
}) => {
  const { code, user_id, store_id, order_amount, product_ids, category_ids, variant_ids = [] } = params;
  const now = new Date();

  const discount = await Discount.findOne({
    where: {
      code: code.toUpperCase(),
      store_id,
      is_deleted: false,
      status: true,
      [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: now } }],
      [Op.and]: [{ [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: now } }] }],
    },
    include: [{ model: DiscountApplicability, as: "applicability" }],
  });

  if (!discount) {
    throw Object.assign(new Error("Invalid or expired discount code"), { statusCode: 422 });
  }

  // Check usage limit
  if (discount.usage_limit !== null) {
    const totalUsed = await DiscountUsage.count({ where: { discount_id: discount.id } });
    if (totalUsed >= discount.usage_limit) {
      throw Object.assign(new Error("This discount code has reached its usage limit"), { statusCode: 422 });
    }
  }

  // Check per-user usage
  if (discount.usage_per_user !== null) {
    const userUsed = await DiscountUsage.count({ where: { discount_id: discount.id, user_id } });
    if (userUsed >= discount.usage_per_user) {
      throw Object.assign(new Error("You have already used this discount code the maximum number of times"), { statusCode: 422 });
    }
  }

  // Check minimum order amount
  if (discount.min_order_amount !== null && order_amount < discount.min_order_amount) {
    throw Object.assign(
      new Error(`Minimum order amount of ${discount.min_order_amount} required for this discount`),
      { statusCode: 422 }
    );
  }

  // Check first-order restriction
  if (discount.is_first_order) {
    const pastOrders = await Order.count({ where: { user_id } });
    if (pastOrders > 0) {
      throw Object.assign(
        new Error("This discount is only available for first-time orders"),
        { statusCode: 422 }
      );
    }
  }

  // Check applicability scope
  const applicability = (discount as unknown as { applicability: { type: string; ref_id: number }[] }).applicability;
  if (applicability && applicability.length > 0) {
    const productMatch      = applicability.some(a => a.type === "product"  && product_ids.includes(a.ref_id));
    const categoryMatch     = applicability.some(a => a.type === "category" && category_ids.includes(a.ref_id));
    const skuMatch          = applicability.some(a => a.type === "sku"      && variant_ids.includes(a.ref_id));
    const userMatch         = applicability.some(a => a.type === "user"     && a.ref_id === user_id);

    let groupMatch = false;
    const groupRules = applicability.filter(a => a.type === "customer_group");
    if (groupRules.length > 0) {
      const groupIds = groupRules.map(a => a.ref_id);
      const membership = await CustomerGroupMember.findOne({
        where: { user_id, customer_group_id: groupIds },
      });
      groupMatch = membership !== null;
    }

    if (!productMatch && !categoryMatch && !skuMatch && !userMatch && !groupMatch) {
      throw Object.assign(new Error("This discount code is not applicable to items in your cart"), { statusCode: 422 });
    }
  }

  // Calculate discount amount
  let discount_amount: number;
  if (discount.type === "flat") {
    discount_amount = Math.min(discount.value, order_amount);
  } else {
    discount_amount = (order_amount * discount.value) / 100;
    if (discount.max_discount_cap !== null) {
      discount_amount = Math.min(discount_amount, discount.max_discount_cap);
    }
  }

  return {
    discount_id: discount.id,
    code: discount.code,
    type: discount.type,
    discount_amount: parseFloat(discount_amount.toFixed(2)),
  };
};

export const recordDiscountUsage = async (params: {
  discount_id: number;
  user_id: number;
  order_id: number;
  discount_amount: number;
}) => {
  return DiscountUsage.create(params);
};
