import { Op } from "sequelize";
import { Order, OrderItem, Product, ProductPrice, ProductInventory, Store, Outlet } from "../../models/index";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RequestItem {
  product_id: number;
  variant_id?: number | null;
  quantity:   number;
}

const ORDER_INCLUDES = [
  { model: OrderItem, include: [{ model: Product, attributes: ["id", "name"] }] },
  { model: Outlet, attributes: ["id", "name", "latitude", "longitude", "address1", "city", "delivery_charge_per_km"] },
];

export const getOrders = async (userId: string) => {
  return Order.findAll({
    where: { user_id: Number(userId) },
    include: ORDER_INCLUDES,
    order: [["created_ts", "DESC"]],
  });
};

export const getOrderById = async (userId: string, orderId: string) => {
  return Order.findOne({
    where: { id: Number(orderId), user_id: Number(userId) },
    include: ORDER_INCLUDES,
  });
};

export const createOrder = async (
  userId: string,
  requestItems: RequestItem[],
  addressId?: number,
  latitude?: number,
  longitude?: number
) => {
  if (!requestItems || requestItems.length === 0) throw new Error("Cart is empty");

  // 1. Get first active store
  const store = await Store.findOne({ where: { is_deleted: false, status: true } });
  if (!store) throw new Error("No store configured");

  // 2. Fetch products and their prices directly
  const productIds = [...new Set(requestItems.map(i => i.product_id))];
  const products   = await Product.findAll({ where: { id: productIds } });
  const productMap = new Map(products.map(p => [p.id, p]));

  const priceRows = await ProductPrice.findAll({
    where: { product_id: productIds, is_deleted: false },
    order: [["priority", "DESC"]],
  });
  // keyed as "productId-variantId" (variantId = "null" for base price)
  const priceMap = new Map<string, number>();
  for (const row of priceRows) {
    const key = `${row.product_id}-${row.variant_id ?? "null"}`;
    if (!priceMap.has(key)) priceMap.set(key, Number(row.price));
  }

  function resolvePrice(productId: number, variantId?: number | null): number {
    if (variantId) {
      const v = priceMap.get(`${productId}-${variantId}`);
      if (v != null) return v;
    }
    const base = priceMap.get(`${productId}-null`);
    if (base != null) return base;
    // any price for this product as last resort
    for (const [key, val] of priceMap.entries()) {
      if (key.startsWith(`${productId}-`)) return val;
    }
    return 0;
  }

  // 3. Assign each item to the outlet with most available inventory
  let fallbackOutletId: number | null = null;

  const assignments: Array<{
    item:      RequestItem;
    product:   Product;
    outletId:  number;
    invId:     number | null;
  }> = [];

  for (const item of requestItems) {
    const product = productMap.get(item.product_id);
    if (!product) continue;

    const inv = await ProductInventory.findOne({
      where: {
        product_id: item.product_id,
        store_id:   store.id,
        saleable_qty: { [Op.gt]: 0 },
      },
      order: [["saleable_qty", "DESC"]],
    });

    let outletId: number;
    if (inv) {
      outletId = inv.outlet_id;
      if (!fallbackOutletId) fallbackOutletId = outletId;
    } else {
      if (!fallbackOutletId) {
        const anyOutlet = await Outlet.findOne({
          where: { store_id: store.id, is_deleted: false, status: true },
        });
        if (!anyOutlet) throw new Error("No outlets configured for this store");
        fallbackOutletId = anyOutlet.id;
      }
      outletId = fallbackOutletId;
    }

    assignments.push({ item, product, outletId, invId: inv?.id ?? null });
  }

  if (assignments.length === 0) throw new Error("No valid products found in cart");

  // 4. Group by outlet
  const byOutlet = new Map<number, typeof assignments>();
  for (const a of assignments) {
    if (!byOutlet.has(a.outletId)) byOutlet.set(a.outletId, []);
    byOutlet.get(a.outletId)!.push(a);
  }

  // 5. Create one Order per outlet group
  const createdOrders: Order[] = [];
  const ts = Date.now().toString(36).toUpperCase();

  for (const [outletId, group] of byOutlet.entries()) {
    const subtotal = group.reduce(
      (sum, { item, product }) => sum + item.quantity * resolvePrice(product.id, item.variant_id),
      0
    );

    // Calculate delivery charge based on distance between customer and outlet
    let deliveryCharge = 0;
    const outlet = await Outlet.findByPk(outletId, {
      attributes: ["latitude", "longitude", "delivery_charge_per_km"],
    });
    if (
      outlet &&
      latitude != null && longitude != null &&
      outlet.latitude != null && outlet.longitude != null
    ) {
      const distanceKm = haversineKm(latitude, longitude, Number(outlet.latitude), Number(outlet.longitude));
      deliveryCharge = Math.round(distanceKm * Number(outlet.delivery_charge_per_km ?? 10) * 100) / 100;
    }

    const order = await Order.create({
      user_id:         Number(userId),
      store_id:        store.id,
      outlet_id:       outletId,
      address_id:      addressId ?? null,
      order_no:        `GRC-${ts}-${outletId}`,
      order_amount:    subtotal,
      total:           Math.round((subtotal + deliveryCharge) * 100) / 100,
      tax:             0,
      discount_amount: 0,
      delivery_charge: deliveryCharge,
      payment_mode:    "cod",
      source:          "MOBILE",
      order_status:    "order_placed",
      latitude:        latitude  ?? null,
      longitude:       longitude ?? null,
    });

    for (const { item, product, invId } of group) {
      await OrderItem.create({
        order_id:   order.id,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity:   item.quantity,
        price:      resolvePrice(product.id, item.variant_id),
        total:      item.quantity * resolvePrice(product.id, item.variant_id),
      });

      if (invId) {
        await ProductInventory.decrement("saleable_qty", {
          by: item.quantity,
          where: { id: invId, saleable_qty: { [Op.gte]: item.quantity } },
        });
      }
    }

    createdOrders.push(order);
  }

  return createdOrders;
};
