import { Store, Outlet, User, Product, Order, Vendor, Category } from "../../models/index";

export async function getOverviewStats() {
  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek  = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    stores,
    outlets,
    users,
    totalProducts,
    activeProducts,
    orders,
    vendorCount,
    categoryCount,
  ] = await Promise.all([
    Store.findAll({
      where: { is_deleted: false },
      attributes: ["id", "name", "status", "created_ts"],
      order: [["created_ts", "DESC"]],
    }),
    Outlet.findAll({
      where: { is_deleted: false },
      attributes: ["id", "store_id"],
    }),
    User.findAll({
      where: { is_deleted: false },
      attributes: ["id", "fname", "lname", "joined_on"],
      order: [["joined_on", "DESC"]],
    }),
    Product.count({ where: { is_deleted: false } }),
    Product.count({ where: { is_deleted: false, status: true } }),
    Order.findAll({
      attributes: ["id", "store_id", "user_id", "total", "created_ts"],
      order: [["created_ts", "DESC"]],
    }),
    Vendor.count({ where: { is_deleted: false, status: true } }),
    Category.count({ where: { is_deleted: false } }),
  ]);

  // ── Store stats ──
  const activeStores    = stores.filter(s => s.status).length;
  const inactiveStores  = stores.length - activeStores;
  const storesThisMonth = stores.filter(s => s.created_ts && new Date(s.created_ts) >= startOfMonth).length;

  // ── Outlet count per store ──
  const outletCountByStore = new Map<number, number>();
  for (const o of outlets) {
    outletCountByStore.set(o.store_id, (outletCountByStore.get(o.store_id) ?? 0) + 1);
  }

  // ── Customer stats ──
  const customersThisMonth = users.filter(u => u.joined_on && new Date(u.joined_on) >= startOfMonth).length;
  const customersThisWeek  = users.filter(u => u.joined_on && new Date(u.joined_on) >= startOfWeek).length;

  // ── Order stats ──
  const totalRevenue    = orders.reduce((s, o) => s + (parseFloat(String(o.total ?? 0)) || 0), 0);
  const ordersThisWeek  = orders.filter(o => o.created_ts && new Date(o.created_ts) >= startOfWeek).length;
  const ordersThisMonth = orders.filter(o => o.created_ts && new Date(o.created_ts) >= startOfMonth).length;

  // ── Per-user order count ──
  const orderCountByUser = new Map<number, number>();
  for (const o of orders) {
    if (o.user_id) orderCountByUser.set(o.user_id, (orderCountByUser.get(o.user_id) ?? 0) + 1);
  }

  // ── Top stores by order count ──
  const storeOrderMap = new Map<number, { order_count: number; revenue: number }>();
  for (const o of orders) {
    if (!o.store_id) continue;
    const entry = storeOrderMap.get(o.store_id) ?? { order_count: 0, revenue: 0 };
    entry.order_count++;
    entry.revenue += parseFloat(String(o.total ?? 0)) || 0;
    storeOrderMap.set(o.store_id, entry);
  }
  const storeNameMap = new Map(stores.map(s => [s.id, s.name]));
  const top_stores = [...storeOrderMap.entries()]
    .sort((a, b) => b[1].order_count - a[1].order_count)
    .slice(0, 5)
    .map(([storeId, stats]) => ({
      id:           storeId,
      name:         storeNameMap.get(storeId) ?? `Store #${storeId}`,
      order_count:  stats.order_count,
      revenue:      stats.revenue,
      outlet_count: outletCountByStore.get(storeId) ?? 0,
    }));

  // ── Weekly activity (last 7 days) ──
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekly_activity = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(sevenDaysAgo);
    dayStart.setDate(sevenDaysAgo.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const s = dayStart.getTime(), e = dayEnd.getTime();
    return {
      day:       DAY_LABELS[dayStart.getDay()],
      orders:    orders.filter(o => { const t = new Date(o.created_ts!).getTime(); return t >= s && t <= e; }).length,
      customers: users.filter(u => { if (!u.joined_on) return false; const t = new Date(u.joined_on).getTime(); return t >= s && t <= e; }).length,
    };
  });

  return {
    stores: {
      total:      stores.length,
      active:     activeStores,
      inactive:   inactiveStores,
      this_month: storesThisMonth,
    },
    outlets: {
      total: outlets.length,
    },
    customers: {
      total:      users.length,
      this_month: customersThisMonth,
      this_week:  customersThisWeek,
    },
    products: {
      total:    totalProducts,
      active:   activeProducts,
      inactive: totalProducts - activeProducts,
    },
    orders: {
      total:         orders.length,
      total_revenue: totalRevenue,
      this_week:     ordersThisWeek,
      this_month:    ordersThisMonth,
    },
    vendors: {
      total: vendorCount,
    },
    categories: {
      total: categoryCount,
    },
    recent_stores: stores.slice(0, 6).map(s => ({
      id:           s.id,
      name:         s.name,
      outlet_count: outletCountByStore.get(s.id) ?? 0,
      status:       s.status ? "active" : "inactive",
      created_ts:   s.created_ts ? new Date(s.created_ts).toISOString() : "",
    })),
    top_stores,
    recent_customers: users.slice(0, 6).map(u => ({
      id:          u.id,
      fname:       u.fname,
      lname:       u.lname,
      joined_on:   u.joined_on ? new Date(u.joined_on).toISOString() : "",
      order_count: orderCountByUser.get(u.id) ?? 0,
    })),
    weekly_activity,
  };
}
