/**
 * Seed: Add sample products for all public (store_id=null) categories.
 * Products are assigned to the parent category so category listing pages
 * show results immediately when a user clicks any category tile.
 * Safe to re-run — skips products whose product_code already exists.
 *
 * Run: npx tsx src/seeders/seedPublicProducts.ts
 */
import sequelize from "../config/database";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const [rows] = await sequelize.query(
      "SELECT id FROM products WHERE slug = ? LIMIT 1",
      { replacements: [slug] }
    ) as [Array<{ id: number }>, unknown];
    if (rows.length === 0) return slug;
    slug = `${base}-${counter++}`;
  }
}

// ── Category → products map ────────────────────────────────────────────────────
// Each entry: [categoryId, prefix, [ [name, price, compareAt], ... ]]

const SEED_DATA: Array<{
  categoryId: number;
  prefix: string;
  items: Array<{ name: string; price: number; compare: number }>;
}> = [
  {
    categoryId: 1, // Fashion
    prefix: "FSH",
    items: [
      { name: "Levi's 511 Slim Fit Jeans",             price: 2499, compare: 3499 },
      { name: "Allen Solly Regular Fit Shirt",          price: 1299, compare: 1799 },
      { name: "Nike Dri-FIT Running T-Shirt",           price: 1499, compare: 1999 },
      { name: "Bata Comfit Casual Shoes",               price: 2199, compare: 2999 },
      { name: "Titan Edge Analog Watch",                price: 3999, compare: 5499 },
      { name: "Fabindia Cotton Kurta",                  price: 1799, compare: 2499 },
      { name: "W Women's Kurti",                        price: 999,  compare: 1499 },
      { name: "Kota Doria Handloom Saree",              price: 1599, compare: 2199 },
      { name: "Zara Floral Wrap Dress",                 price: 2999, compare: 3999 },
      { name: "Woodland High-Ankle Boots",              price: 3499, compare: 4999 },
    ],
  },
  {
    categoryId: 11, // Mobiles
    prefix: "MOB",
    items: [
      { name: "Samsung Galaxy S24 5G",                  price: 74999, compare: 79999 },
      { name: "Apple iPhone 15",                        price: 79900, compare: 84900 },
      { name: "OnePlus 12 5G",                          price: 64999, compare: 69999 },
      { name: "Vivo V30 Pro 5G",                        price: 44999, compare: 49999 },
      { name: "Motorola Edge 50 Pro",                   price: 31999, compare: 35999 },
      { name: "Poco X6 Pro 5G",                         price: 26999, compare: 29999 },
      { name: "Nothing Phone (2a)",                     price: 23999, compare: 27999 },
      { name: "Google Pixel 8a",                        price: 52999, compare: 57999 },
      { name: "Realme 12 Pro+",                         price: 27999, compare: 31999 },
      { name: "Redmi Note 13 Pro 5G",                   price: 23999, compare: 26999 },
    ],
  },
  {
    categoryId: 19, // Beauty
    prefix: "BTY",
    items: [
      { name: "Minimalist 10% Niacinamide Serum",       price: 399,  compare: 599  },
      { name: "Dove Moisturising Body Wash 500ml",      price: 299,  compare: 399  },
      { name: "L'Oreal Paris Hyaluron Moisturiser",     price: 649,  compare: 899  },
      { name: "Plum GoodVibes Green Tea Face Wash",     price: 249,  compare: 349  },
      { name: "Biotique Bio Coconut Sunscreen SPF 40",  price: 299,  compare: 449  },
      { name: "Mamaearth Vitamin C Face Cream",         price: 349,  compare: 499  },
      { name: "WOW Skin Science Aloe Vera Gel",         price: 249,  compare: 349  },
      { name: "Himalaya Purifying Neem Face Pack",      price: 149,  compare: 199  },
      { name: "Lakme 9to5 Lipstick Matte",              price: 399,  compare: 549  },
      { name: "Maybelline Fit Me Foundation",           price: 549,  compare: 749  },
    ],
  },
  {
    categoryId: 26, // Electronics
    prefix: "ELC",
    items: [
      { name: "Sony WH-1000XM5 Headphones",            price: 26990, compare: 34990 },
      { name: "Apple Watch Series 9 GPS",               price: 41900, compare: 44900 },
      { name: "Logitech MX Master 3 Mouse",             price: 7495,  compare: 9995  },
      { name: "Samsung T7 1TB Portable SSD",            price: 8999,  compare: 11999 },
      { name: "Anker 65W GaN Charger",                  price: 2499,  compare: 3499  },
      { name: "JBL Go 4 Bluetooth Speaker",             price: 3499,  compare: 4499  },
      { name: "Realme Pad X Tablet",                    price: 18999, compare: 22999 },
      { name: "Canon EOS 1500D DSLR Camera",            price: 34990, compare: 42990 },
      { name: "Lenovo IdeaPad Slim 3 Laptop",           price: 49990, compare: 59990 },
      { name: "boAt Bassheads 242 Wired Earphones",     price: 449,   compare: 699   },
    ],
  },
  {
    categoryId: 36, // Home
    prefix: "HOM",
    items: [
      { name: "Solimo 100% Cotton Bath Towel",          price: 499,  compare: 699  },
      { name: "Milton Thermosteel Flask 1L",            price: 849,  compare: 1199 },
      { name: "Pigeon Pressure Cooker 3L",              price: 1299, compare: 1799 },
      { name: "Borosil Glass Mixing Bowls Set of 3",    price: 799,  compare: 1099 },
      { name: "Philips LED Bulb 9W (Pack of 4)",        price: 349,  compare: 499  },
      { name: "HomeStrap Non-Slip Velvet Hangers 30pk", price: 549,  compare: 799  },
      { name: "Cello Opalware Dinner Set 27pc",         price: 1999, compare: 2799 },
      { name: "Story@Home Bedsheet King Size",          price: 699,  compare: 999  },
      { name: "Amazon Basics Curtain Panel Pair",       price: 899,  compare: 1299 },
      { name: "Cosco Plastic Storage Container Set",    price: 649,  compare: 899  },
    ],
  },
  {
    categoryId: 57, // Baby Products
    prefix: "BBY",
    items: [
      { name: "Pampers Premium Care Diapers M 62pc",   price: 849,  compare: 1099 },
      { name: "Himalaya Baby Lotion 400ml",             price: 249,  compare: 349  },
      { name: "Fisher-Price Infant-to-Toddler Rocker",  price: 3999, compare: 5499 },
      { name: "Mee Mee Baby Feeding Bottle 250ml",      price: 349,  compare: 499  },
      { name: "Huggies Wonder Pants M 56pc",            price: 799,  compare: 999  },
      { name: "Chicco Baby Carrier Soft & Dream",       price: 3499, compare: 4999 },
      { name: "Funskool Giggles Activity Gym",          price: 1499, compare: 1999 },
      { name: "Sebamed Baby Wash Extra Soft 500ml",     price: 599,  compare: 799  },
      { name: "VTech Rhymes & Stories Teddy",           price: 1299, compare: 1799 },
      { name: "LuvLap Tiny Toes Baby Shoes",            price: 399,  compare: 549  },
    ],
  },
  {
    categoryId: 63, // Sports
    prefix: "SPT",
    items: [
      { name: "SG Club Cricket Bat English Willow",     price: 2499, compare: 3299 },
      { name: "Nivia Aspire Football Size 5",           price: 799,  compare: 1099 },
      { name: "Cosco Talco Shuttlecock (Pack of 6)",    price: 299,  compare: 449  },
      { name: "Spalding NBA Street Basketball",         price: 1799, compare: 2499 },
      { name: "Yonex Voltric 1 DG Badminton Racket",   price: 2999, compare: 3999 },
      { name: "Speedo Fastskin Endurance Swimsuit",     price: 3499, compare: 4999 },
      { name: "Firefox Bikes Turbo 26T Mountain Bike",  price: 9999, compare: 13999 },
      { name: "Decathlon Kalenji Running Shoes",        price: 2499, compare: 3499 },
      { name: "MRF X-Plod Hockey Stick",                price: 1299, compare: 1799 },
      { name: "Speedo Unisex Swim Goggles",             price: 799,  compare: 1099 },
    ],
  },
  {
    categoryId: 80, // Automotive
    prefix: "AUT",
    items: [
      { name: "MRF ZVTS Tyre 165/70 R14",              price: 3299, compare: 4299 },
      { name: "Varta Silver Dynamic Car Battery 65Ah",  price: 7499, compare: 9499 },
      { name: "Garmin DriveSmart 55 GPS Navigator",     price: 8999, compare: 11999 },
      { name: "3M Auto Wash Shampoo 250ml",             price: 349,  compare: 499  },
      { name: "Castrol EDGE 5W-30 Engine Oil 4L",       price: 2399, compare: 2999 },
      { name: "Elegant Milano Royal Seat Cover Set",    price: 3499, compare: 4999 },
      { name: "Steelbird SBH-17 Full Face Helmet",      price: 1499, compare: 1999 },
      { name: "Pioneer MVH-S320BT Car Stereo",          price: 5499, compare: 7499 },
      { name: "Philips Vision Plus H4 Headlight Bulb",  price: 699,  compare: 999  },
      { name: "Ambi Pur Car Air Freshener Spray",       price: 299,  compare: 449  },
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // Get any admin to use as created_by
  const [adminRows] = await sequelize.query(
    "SELECT id FROM admins WHERE is_deleted = 0 ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];

  if (adminRows.length === 0) {
    console.error("No admin found. Run seed.ts first.");
    process.exit(1);
  }
  const createdBy = adminRows[0]!.id;
  console.log(`Using admin id=${createdBy} for created_by`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const cat of SEED_DATA) {
    console.log(`\n── Category ${cat.categoryId} (prefix=${cat.prefix}) ──`);

    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i]!;
      const code = `${cat.prefix}${String(i + 1).padStart(2, "0")}`;

      // Skip if already seeded
      const [existing] = await sequelize.query(
        "SELECT id FROM products WHERE product_code = ? LIMIT 1",
        { replacements: [code] }
      ) as [Array<{ id: number }>, unknown];

      if (existing.length > 0) {
        console.log(`  [SKIP] ${code} — "${item.name}"`);
        totalSkipped++;
        continue;
      }

      const slug = await uniqueSlug(slugify(item.name));

      // Insert product
      await sequelize.query(
        `INSERT INTO products
          (product_code, name, description, category_id, store_id, slug, status, is_draft, is_deleted, created_by, created_ts, updated_ts)
         VALUES (?, ?, ?, ?, NULL, ?, 1, 0, 0, ?, NOW(), NOW())`,
        { replacements: [code, item.name, item.name, cat.categoryId, slug, createdBy] }
      );

      const [newProd] = await sequelize.query(
        "SELECT id FROM products WHERE product_code = ? LIMIT 1",
        { replacements: [code] }
      ) as [Array<{ id: number }>, unknown];
      const productId = newProd[0]!.id;

      // Insert price (no variant, global price)
      await sequelize.query(
        `INSERT INTO product_prices
          (product_id, variant_id, price, compare_at_price, final_price, min_qty, priority, status, is_deleted, created_ts, updated_ts)
         VALUES (?, NULL, ?, ?, ?, 1, 0, 1, 0, NOW(), NOW())`,
        { replacements: [productId, item.price, item.compare, item.price] }
      );

      console.log(`  [OK]   ${code} — "${item.name}" (id=${productId}, ₹${item.price})`);
      totalCreated++;
    }
  }

  console.log(`\nDone. Created: ${totalCreated}, Skipped: ${totalSkipped}`);
  await sequelize.close();
}

run().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
