/**
 * seedDashboardData.ts
 * Creates realistic demo data so the dashboard shows meaningful numbers.
 * Run: npx tsx src/scripts/seedDashboardData.ts
 *
 * Creates:
 *  - 6 product categories
 *  - 18 products (3 per category) with prices & inventory
 *  - 40 customers spread over the last 30 days
 *  - ~120 orders spread over the last 30 days with order items
 */

import sequelize from "../config/database";
import "../models/index";
import Store from "../models/store.model";
import Outlet from "../models/outlet.model";
import Category from "../models/category.model";
import Product from "../models/product.model";
import ProductPrice from "../models/productPrice.model";
import ProductInventory from "../models/productInventory.model";
import ProductOutlet from "../models/productOutlet.model";
import User from "../models/user.model";
import Order from "../models/order.model";
import OrderItem from "../models/orderItem.model";
import bcrypt from "bcryptjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Random integer in [min, max] */
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Data definitions ─────────────────────────────────────────────────────────

const CATEGORY_DEFS = [
  { name: "Men's Fashion",     slug: "mens-fashion"     },
  { name: "Women's Fashion",   slug: "womens-fashion"   },
  { name: "Electronics",       slug: "electronics"      },
  { name: "Home & Kitchen",    slug: "home-kitchen"     },
  { name: "Beauty & Personal", slug: "beauty-personal"  },
  { name: "Sports & Fitness",  slug: "sports-fitness"   },
];

/** Products per category — [name, price, stock] */
const PRODUCT_DEFS: Record<string, [string, number, number][]> = {
  "Men's Fashion":     [
    ["Men's Slim Fit Shirt",    899,  120],
    ["Men's Casual Chinos",    1299,  80],
    ["Men's Sports Jacket",    2499,  50],
  ],
  "Women's Fashion":   [
    ["Women's Floral Kurta",    799, 150],
    ["Women's Denim Jeans",    1599,  90],
    ["Women's Maxi Dress",     1899,  60],
  ],
  "Electronics":       [
    ["Wireless Earbuds",       2999,  70],
    ["Smart Watch",            4999,  40],
    ["Portable Bluetooth Speaker", 1999, 55],
  ],
  "Home & Kitchen":    [
    ["Stainless Steel Cookware Set", 3499, 35],
    ["Electric Kettle",         899,  80],
    ["Non-Stick Frying Pan",    699,  95],
  ],
  "Beauty & Personal": [
    ["Vitamin C Face Serum",    499, 200],
    ["Hair Care Combo Pack",    799, 130],
    ["Sunscreen SPF 50",        349, 180],
  ],
  "Sports & Fitness":  [
    ["Yoga Mat Premium",        999,  60],
    ["Resistance Bands Set",    599,  90],
    ["Water Bottle Insulated",  699, 110],
  ],
};

const FIRST_NAMES = ["Aarav","Priya","Rahul","Sneha","Vikram","Ananya","Rohit","Divya","Karan","Meera",
  "Arjun","Pooja","Nikhil","Shreya","Amit","Riya","Suresh","Kavya","Deepak","Nisha",
  "Varun","Anjali","Raj","Simran","Aditya","Preeti","Sanjay","Swati","Mohit","Lavanya",
  "Vikas","Tanvi","Gaurav","Pallavi","Akash","Bhavna","Rajeev","Sunita","Manish","Jyoti"];

const LAST_NAMES  = ["Sharma","Patel","Singh","Kumar","Verma","Gupta","Joshi","Shah","Mehta","Nair",
  "Reddy","Iyer","Pillai","Chopra","Malhotra","Kapoor","Bose","Chatterjee","Das","Roy"];

const STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled"] as const;
const STATUS_WEIGHTS = [10, 15, 15, 20, 30, 10]; // rough distribution

function weightedStatus() {
  const total = STATUS_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < STATUSES.length; i++) {
    r -= STATUS_WEIGHTS[i];
    if (r <= 0) return STATUSES[i];
  }
  return "pending" as const;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await sequelize.authenticate();
  console.log("✓ DB connected");

  // ── Find store & outlet ───────────────────────────────────────────────────
  const store = await Store.findOne({ order: [["id", "ASC"]] });
  if (!store) throw new Error("No store found — run seed.ts first.");

  const outlet = await Outlet.findOne({ where: { store_id: store.id }, order: [["id", "ASC"]] });
  if (!outlet) throw new Error("No outlet found for store — run seed.ts first.");

  console.log(`Using store: "${store.name}" (id=${store.id}), outlet: "${outlet.name}" (id=${outlet.id})`);

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryMap = new Map<string, number>();

  for (const def of CATEGORY_DEFS) {
    const [cat, created] = await Category.findOrCreate({
      where: { slug: def.slug, store_id: store.id },
      defaults: { name: def.name, slug: def.slug, store_id: store.id, status: true },
    });
    categoryMap.set(def.name, cat.id);
    console.log(`Category "${def.name}": ${created ? "created" : "exists"} (id=${cat.id})`);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const products: { id: number; price: number }[] = [];

  let productCounter = Date.now(); // unique suffix

  for (const [catName, items] of Object.entries(PRODUCT_DEFS)) {
    const category_id = categoryMap.get(catName)!;

    for (const [name, price, stock] of items) {
      const productCode = `PRD-${(productCounter++ % 99999).toString().padStart(5, "0")}`;
      const productSlug = `${slug(name)}-${productCode.toLowerCase()}`;

      const [product, created] = await Product.findOrCreate({
        where: { product_code: productCode },
        defaults: {
          name,
          description: `High-quality ${name} available in various sizes.`,
          product_code: productCode,
          slug: productSlug,
          category_id,
          store_id: store.id,
          is_stockable: true,
          status: true,
          is_draft: false,
          is_deleted: false,
          created_by: 1,
        },
      });

      // Price
      await ProductPrice.findOrCreate({
        where: { product_id: product.id, variant_id: null, outlet_id: null },
        defaults: { product_id: product.id, variant_id: null, price, outlet_id: null, status: true },
      });

      // Inventory
      await ProductInventory.findOrCreate({
        where: { product_id: product.id, outlet_id: outlet.id, variant_id: null },
        defaults: {
          product_id: product.id,
          variant_id: null,
          store_id: store.id,
          outlet_id: outlet.id,
          sku: productCode,
          saleable_qty: stock,
          non_saleable_qty: 0,
        },
      });

      // Outlet association
      await ProductOutlet.findOrCreate({
        where: { product_id: product.id, outlet_id: outlet.id },
        defaults: { product_id: product.id, outlet_id: outlet.id },
      });

      products.push({ id: product.id, price });
      console.log(`  Product "${name}": ${created ? "created" : "exists"} (id=${product.id}, ₹${price})`);
    }
  }

  // ── Customers ─────────────────────────────────────────────────────────────
  const userIds: number[] = [];

  for (let i = 0; i < 40; i++) {
    const fname = FIRST_NAMES[i % FIRST_NAMES.length];
    const lname  = pick(LAST_NAMES);
    const email  = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@demo.com`;
    const joinedDaysAgo = rand(0, 29);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        fname,
        lname,
        email,
        password: passwordHash,
        joined_on: daysAgo(joinedDaysAgo),
        status: true,
        is_deleted: false,
        is_email_verified: true,
        is_phone_verified: false,
      },
    });
    userIds.push(user.id);
    if (created) process.stdout.write(".");
  }
  console.log(`\n✓ 40 customers ready`);

  // ── Orders ────────────────────────────────────────────────────────────────
  let orderSeq = Date.now();
  let ordersCreated = 0;

  // Spread ~120 orders over last 30 days with more weight towards recent days
  // Day 0 (today): ~8 orders, day 1: ~7, ... tapering off
  for (let daysBack = 0; daysBack <= 29; daysBack++) {
    // More orders on recent days
    const count = daysBack === 0 ? rand(6, 10)
                : daysBack <= 6  ? rand(3, 7)
                : daysBack <= 13 ? rand(2, 5)
                :                  rand(1, 3);

    for (let j = 0; j < count; j++) {
      const user_id     = pick(userIds);
      const orderStatus = weightedStatus();
      const orderNo     = `ORD-${(orderSeq++).toString().slice(-8)}`;

      // 1–4 random items per order
      const numItems = rand(1, 4);
      const itemProducts = Array.from({ length: numItems }, () => pick(products));

      const items = itemProducts.map((p) => {
        const qty   = rand(1, 3);
        const total = p.price * qty;
        return { product_id: p.id, quantity: qty, price: p.price, tax: 0, total };
      });

      const order_amount = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const total        = order_amount;

      // Set created_ts to the appropriate day (with a random hour)
      const orderDate = daysAgo(daysBack);
      orderDate.setHours(rand(8, 22), rand(0, 59), rand(0, 59), 0);

      const order = await Order.create({
        user_id,
        store_id:     store.id,
        outlet_id:    outlet.id,
        order_no:     orderNo,
        order_status: orderStatus,
        order_amount,
        discount_amount: 0,
        tax:          0,
        total,
        payment_mode: pick(["cod", "online", "upi", "card"]),
        source:       pick(["WEB", "APP", "ADMIN"]),
      });

      // Manually set created_ts via raw query so it reflects the past date
      await sequelize.query(
        `UPDATE orders SET created_ts = ? WHERE id = ?`,
        { replacements: [orderDate, order.id] }
      );

      // Order items
      for (const item of items) {
        await OrderItem.create({ order_id: order.id, ...item });
      }

      ordersCreated++;
    }
  }

  console.log(`✓ ${ordersCreated} orders created across last 30 days`);
  console.log("\n🎉 Dashboard seed complete! Refresh the dashboard to see live data.");

  await sequelize.close();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  console.error(err);
  process.exit(1);
});
