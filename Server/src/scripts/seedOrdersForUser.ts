import sequelize from "../config/database";
import User from "../models/user.model";
import Order from "../models/order.model";
import OrderItem from "../models/orderItem.model";
import Product from "../models/product.model";
import ProductPrice from "../models/productPrice.model";
import Store from "../models/store.model";
import Outlet from "../models/outlet.model";

async function main() {
  await sequelize.authenticate();
  console.log("DB connected");

  // Find first active user
  const user = await User.findOne({ where: { is_deleted: false, status: true } });
  if (!user) throw new Error("No active user found. Register a user via the website first.");
  console.log(`Seeding orders for user: ${user.email} (id=${user.id})`);

  // Find store and outlet
  const store = await Store.findOne({ where: { is_deleted: false, status: true } });
  if (!store) throw new Error("No store found.");

  const outlet = await Outlet.findOne({ where: { store_id: store.id, is_deleted: false, status: true } });
  if (!outlet) throw new Error("No outlet found for this store.");

  // Get active products
  const products = await Product.findAll({ where: { is_deleted: false, status: true }, limit: 20 });
  if (products.length === 0) throw new Error("No active products found.");

  // Get prices for those products
  const productIds = products.map((p) => p.id);
  const prices = await ProductPrice.findAll({
    where: { product_id: productIds, is_deleted: false, status: true },
    limit: 20,
  });

  // Deduplicate by product_id — keep one price per product
  const seenProducts = new Set<number>();
  const uniquePrices = prices.filter((pp) => {
    if (seenProducts.has(pp.product_id)) return false;
    seenProducts.add(pp.product_id);
    return true;
  });

  if (uniquePrices.length === 0) throw new Error("No product prices found.");

  // Check for existing seeded orders
  const existing = await Order.count({ where: { user_id: user.id } });
  if (existing > 0) {
    console.log(`User already has ${existing} orders. Skipping seed.`);
    await sequelize.close();
    return;
  }

  const statuses: Array<"pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"> =
    ["delivered", "delivered", "shipped", "processing", "confirmed", "pending", "cancelled"];

  const paymentModes: Array<"card" | "cod"> = ["card", "cod"];

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const orderDate = new Date(now - (statuses.length - i) * 5 * DAY);
    const orderNo = `ORD-SEED-${Date.now()}-${i}`;

    // Pick 1–3 random products
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedPrices = [...uniquePrices].sort(() => Math.random() - 0.5).slice(0, itemCount);

    let orderAmount = 0;
    const itemsData = selectedPrices.map((pp) => {
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = Number(pp.price);
      const tax = parseFloat((price * qty * 0.05).toFixed(2));
      const total = parseFloat((price * qty + tax).toFixed(2));
      orderAmount += total;
      return { product_id: pp.product_id, variant_id: pp.variant_id ?? null, quantity: qty, price, tax, total };
    });

    const tax = parseFloat((orderAmount * 0.05).toFixed(2));
    const total = parseFloat((orderAmount + tax).toFixed(2));

    const order = await Order.create({
      user_id: user.id,
      store_id: store.id,
      outlet_id: outlet.id,
      order_no: orderNo,
      order_status: status,
      order_amount: parseFloat(orderAmount.toFixed(2)),
      tax,
      discount_amount: 0,
      total,
      payment_mode: paymentModes[i % paymentModes.length],
      source: "WEB",
    });

    // Backdate order
    await sequelize.query(`UPDATE orders SET created_ts = ? WHERE id = ?`, {
      replacements: [orderDate.toISOString().slice(0, 19).replace("T", " "), order.id],
    });

    for (const item of itemsData) {
      await OrderItem.create({ order_id: order.id, ...item });
    }

    console.log(`  Created order ${orderNo} (${status}, ${itemsData.length} items, total ₹${total})`);
  }

  console.log(`\nDone! Created ${statuses.length} sample orders for ${user.email}`);
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
