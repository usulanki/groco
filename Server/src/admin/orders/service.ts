import { Op } from "sequelize";
import sequelize from "../../config/database";
import { Order, OrderItem, Product, ProductVariant, VariantAttributeValue, VariantAttribute, User, Outlet, Address, City, State, Discount, CustomerGroupMember, CustomerGroup, OrderHistory } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateOrderDto, OrderStatus } from "./types";

type Actor = { id: number; fname: string; lname: string };

async function logHistory(order_id: number, action: string, actor: Actor | null) {
  await OrderHistory.create({
    order_id,
    action,
    admin_id:     actor?.id ?? null,
    performed_by: actor ? `${actor.fname} ${actor.lname}`.trim() : null,
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const notFoundError = (): AppError =>
  Object.assign(new Error("Order not found"), { statusCode: 404 });

// ─── Order number generator ───────────────────────────────────────────────────

async function generateOrderNo(): Promise<string> {
  const today  = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `ORD${today}`;
  const latest = await Order.findOne({
    where: { order_no: { [Op.like]: `${prefix}%` } },
    order: [["order_no", "DESC"]],
  });
  const next = latest ? parseInt(latest.order_no.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export const listOrders = async (params: {
  page: number;
  limit: number;
  order_status?: OrderStatus | OrderStatus[];
  search?: string;
  customer_id?: number;
  outlet_id?: number;
  sort_order?: "ASC" | "DESC";
  date_from?: string;
  date_to?: string;
}) => {
  const { page, limit, order_status, search, customer_id, outlet_id, sort_order = "DESC", date_from, date_to } = params;

  const where: Record<string, unknown> = {};
  if (outlet_id) where.outlet_id = outlet_id;
  if (order_status) {
    where.order_status = Array.isArray(order_status) && order_status.length > 1
      ? { [Op.in]: order_status }
      : Array.isArray(order_status) ? order_status[0] : order_status;
  }
  if (customer_id) where.user_id = customer_id;
  if (search)      where.order_no = { [Op.like]: `%${search}%` };
  if (date_from || date_to) {
    let toDate: Date | undefined
    if (date_to) {
      toDate = new Date(date_to)
      toDate.setUTCDate(toDate.getUTCDate() + 1) // include the full to-date day in UTC
    }
    where.created_ts = {
      ...(date_from && { [Op.gte]: new Date(date_from) }),
      ...(toDate    && { [Op.lt]:  toDate }),
    };
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    attributes: {
      include: [[
        sequelize.literal(
          "(SELECT COUNT(*) FROM order_items WHERE order_items.order_id = `Order`.id AND order_items.is_deleted = false)"
        ),
        "item_count",
      ]],
    },
    include: [
      { model: User, attributes: ["id", "fname", "lname", "email", "phone"] },
      {
        model: OrderItem,
        where: { is_deleted: false },
        required: false,
        include: [
          { model: Product, attributes: ["id", "name", "product_code"] },
          {
            model: ProductVariant,
            as: "Variant",
            attributes: ["id", "sku"],
            required: false,
            include: [{
              model: VariantAttributeValue,
              as: "attributeValues",
              attributes: ["id", "value"],
              through: { attributes: [] },
              include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
            }],
          },
        ],
      },
    ],
    limit,
    offset: (page - 1) * limit,
    order: [["created_ts", sort_order]],
    distinct: true,
  });

  return { rows, count };
};

// ─── Get by id ────────────────────────────────────────────────────────────────

export const getOrderById = async (id: number) => {
  const order = await Order.findByPk(id, {
    include: [
      {
        model: User,
        attributes: ["id", "fname", "lname", "email", "phone"],
        include: [{
          model: CustomerGroupMember,
          required: false,
          include: [{ model: CustomerGroup, attributes: ["id", "name"] }],
        }],
      },
      { model: Outlet, attributes: ["id", "name"] },
      {
        model: Address,
        attributes: ["id", "address1", "address2", "pincode"],
        include: [
          { model: City,  attributes: ["id", "name"] },
          { model: State, attributes: ["id", "name"] },
        ],
      },
      {
        model: OrderItem,
        where: { is_deleted: false },
        required: false,
        include: [
          { model: Product, attributes: ["id", "name", "product_code"] },
          {
            model: ProductVariant,
            as: "Variant",
            attributes: ["id", "sku"],
            required: false,
            include: [{
              model: VariantAttributeValue,
              as: "attributeValues",
              attributes: ["id", "value"],
              through: { attributes: [] },
              include: [{ model: VariantAttribute, as: "attribute", attributes: ["id", "name"] }],
            }],
          },
        ],
      },
    ],
  });
  if (!order) throw notFoundError();
  return order;
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createOrder = async (
  data: CreateOrderDto,
  admin: { store_id: number | null; outlet_id: number | null; id?: number; fname?: string; lname?: string }
) => {
  // 1. Resolve store_id from admin context
  const store_id = admin.store_id;
  if (!store_id) {
    throw Object.assign(new Error("Admin is not assigned to a store"), { statusCode: 400 }) as AppError;
  }

  // 2. Resolve outlet_id
  let outlet_id: number;
  if (data.auto_assign || !data.outlet_id) {
    if (admin.outlet_id) {
      outlet_id = admin.outlet_id;
    } else {
      const outlet = await Outlet.findOne({ where: { store_id, is_deleted: false, status: true } });
      if (!outlet) {
        throw Object.assign(new Error("No active outlet found for this store"), { statusCode: 400 }) as AppError;
      }
      outlet_id = outlet.id;
    }
  } else {
    outlet_id = data.outlet_id;
  }

  // 3. Calculate line totals
  const lines = data.items.map((item) => {
    const tax   = parseFloat((item.tax ?? 0).toFixed(2));
    const total = parseFloat((item.price * item.quantity + tax).toFixed(2));
    return { ...item, tax, total };
  });

  const order_amount    = parseFloat(lines.reduce((s, l) => s + l.price * l.quantity, 0).toFixed(2));
  const totalTax        = parseFloat(lines.reduce((s, l) => s + l.tax,                0).toFixed(2));
  const subtotalWithTax = order_amount + totalTax;

  // 4. Apply coupon discount (best-effort — no error if invalid)
  let discount_amount = 0;
  if (data.coupon_code?.trim()) {
    const coupon = await Discount.findOne({
      where: { code: data.coupon_code.trim(), store_id, status: true, is_deleted: false },
    });
    if (coupon) {
      if (coupon.min_order_amount && subtotalWithTax < Number(coupon.min_order_amount)) {
        // below minimum — skip
      } else if (coupon.type === "flat") {
        discount_amount = Math.min(Number(coupon.value), subtotalWithTax);
      } else {
        discount_amount = parseFloat((subtotalWithTax * Number(coupon.value) / 100).toFixed(2));
        if (coupon.max_discount_cap) {
          discount_amount = Math.min(discount_amount, Number(coupon.max_discount_cap));
        }
      }
      discount_amount = parseFloat(discount_amount.toFixed(2));
    }
  }

  const total    = parseFloat((subtotalWithTax - discount_amount).toFixed(2));
  const order_no = await generateOrderNo();

  // 5. Persist in a transaction
  const t = await sequelize.transaction();
  try {
    const order = await Order.create(
      {
        user_id:           data.user_id,
        address_id:        data.address_id ?? null,
        store_id,
        outlet_id,
        order_no,
        order_amount,
        tax:               totalTax,
        discount_amount,
        total,
        payment_mode:      data.payment_mode,
        payment_reference: data.payment_reference ?? null,
        notes:             data.notes ?? null,
        source:            "ADMIN",
        order_status:      "order_placed",
      },
      { transaction: t }
    );

    await Promise.all(
      lines.map((line) =>
        OrderItem.create(
          {
            order_id:   order.id,
            product_id: line.product_id,
            variant_id: line.variant_id ?? null,
            quantity:   line.quantity,
            price:      line.price,
            tax:        line.tax,
            total:      line.total,
          },
          { transaction: t }
        )
      )
    );

    await t.commit();

    const customer = await User.findByPk(data.user_id, { attributes: ["fname", "lname"] });
    const customerName = customer ? `${customer.fname} ${customer.lname}`.trim() : `Customer #${data.user_id}`;
    const actor: Actor | null = (admin.id && admin.fname !== undefined && admin.lname !== undefined)
      ? { id: admin.id, fname: admin.fname, lname: admin.lname }
      : null;
    await logHistory(order.id, `Order placed for ${customerName}`, actor);

    const result = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, include: [{ model: Product, attributes: ["id", "name"] }] },
      ],
    });
    return { orders: [result] };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteOrder = async (id: number): Promise<void> => {
  const order = await Order.findByPk(id);
  if (!order) throw notFoundError();
  await order.destroy();
};

// ─── Change status ────────────────────────────────────────────────────────────

export const changeOrderStatus = async (id: number, order_status: OrderStatus, actor: Actor | null = null) => {
  const order = await Order.findByPk(id);
  if (!order) throw notFoundError();
  const prev = capitalize(order.order_status as string);
  const next = capitalize(order_status as string);
  await order.update({ order_status });
  await logHistory(id, `Status changed: ${prev} → ${next}`, actor);
  return order;
};

// ─── Transfer outlet ──────────────────────────────────────────────────────────

export const transferOrderOutlet = async (id: number, outlet_id: number, actor: Actor | null = null) => {
  const order = await Order.findByPk(id);
  if (!order) throw notFoundError();
  const outlet = await Outlet.findByPk(outlet_id);
  if (!outlet) throw Object.assign(new Error("Outlet not found"), { statusCode: 404 });
  await order.update({ outlet_id });
  await logHistory(id, `Transferred to ${outlet.name}`, actor);
  return getOrderById(id);
};

// ─── Get history ──────────────────────────────────────────────────────────────

export const getOrderHistory = async (order_id: number) => {
  const order = await Order.findByPk(order_id, { attributes: ["id"] });
  if (!order) throw notFoundError();
  return OrderHistory.findAll({
    where: { order_id },
    order: [["created_ts", "ASC"]],
    attributes: ["id", "action", "performed_by", "admin_id", "created_ts"],
  });
};
