/**
 * Seed: Add Automotive products — 10 per subcategory, each with variants, images, and prices.
 * Prerequisites: Run seedAutomotiveCategory.ts and seedAutomotiveBrands.ts first.
 * Also adds Seat Covers and Car Fresheners subcategories if not already present.
 * Safe to re-run — skips any product whose product_code already exists.
 *
 * Run: npx tsx src/seeders/seedAutomotiveProducts.ts
 */
import sequelize from "../config/database";

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueProductSlug(base: string): Promise<string> {
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

async function uniqueCategorySlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (true) {
    const [rows] = await sequelize.query(
      "SELECT id FROM categories WHERE slug = ? LIMIT 1",
      { replacements: [slug] }
    ) as [Array<{ id: number }>, unknown];
    if (rows.length === 0) return slug;
    slug = `${base}-${counter++}`;
  }
}

function genBarcode(catIdx: number, prodIdx: number, varIdx: number): string {
  const raw = `87${catIdx + 1}${String(prodIdx + 1).padStart(2, "0")}${varIdx + 1}000000`;
  return raw.slice(0, 13);
}

function imageUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/500/500`;
}

// ── Subcategory data definitions ───────────────────────────────────────────────

interface VariantDef {
  value: string;
  price: number;
  compare: number;
}

interface SubcategoryDef {
  name: string;
  code: string;       // product_code prefix, e.g. "TY"
  attribute: string;  // variant attribute name
  variants: VariantDef[];
  brands: string[];   // 10 entries (one per product)
  products: string[]; // 10 model name suffixes (appended after brand)
}

const SUBCATEGORY_DATA: SubcategoryDef[] = [
  {
    name: "Tyres",
    code: "TY",
    attribute: "Tyre Size",
    variants: [
      { value: "165/70 R14", price: 3299, compare: 4299 },
      { value: "185/65 R15", price: 4499, compare: 5799 },
      { value: "205/55 R16", price: 5999, compare: 7799 },
    ],
    brands: ["MRF", "Apollo", "CEAT", "Bridgestone", "JK Tyre", "Michelin", "Goodyear", "TVS Eurogrip", "Maxxis", "Continental"],
    products: [
      "ZVTS C4 Tyre",
      "Alnac 4G Tyre",
      "SecuraDrive Tyre",
      "Turanza T005 Tyre",
      "UX Royale Tyre",
      "Energy XM2+ Tyre",
      "Assurance TripleMax Tyre",
      "Atlero GO Tyre",
      "Prorata MA301 Tyre",
      "ContiEcoContact 5 Tyre",
    ],
  },
  {
    name: "Cleaning",
    code: "CL",
    attribute: "Volume",
    variants: [
      { value: "200 ml", price: 199, compare: 299 },
      { value: "500 ml", price: 399, compare: 549 },
      { value: "1 L",    price: 699, compare: 999 },
    ],
    brands: ["3M", "Meguiar's", "Turtle Wax", "WD-40", "Sonax", "3M", "Meguiar's", "Turtle Wax", "WD-40", "Sonax"],
    products: [
      "Auto Wash Shampoo",
      "Gold Class Car Wash",
      "Original Carnauba Wax",
      "Specialist Degreaser",
      "Profiline Car Shampoo",
      "Interior Detailer Spray",
      "Ultimate Compound",
      "Tire & Wheel Cleaner",
      "Multi-Use Product Spray",
      "Xtreme Interior Cleaner",
    ],
  },
  {
    name: "Dashcam",
    code: "DC",
    attribute: "Resolution",
    variants: [
      { value: "1080p FHD", price: 2499,  compare: 3499  },
      { value: "1440p QHD", price: 4999,  compare: 6499  },
      { value: "4K UHD",    price: 8999,  compare: 11999 },
    ],
    brands: ["Qubo", "70mai", "Viofo", "Garmin", "BlackVue", "Nextbase", "DDPai", "Vantrue", "Thinkware", "Garmin"],
    products: [
      "Smart Dash Camera HCD01",
      "Dash Cam A400",
      "A119 Mini 2 Dash Cam",
      "Dash Cam Mini 2",
      "DR750X-1CH Dash Cam",
      "222 Dash Cam",
      "Mini5 Dash Cam",
      "N4 3 Channel Dash Cam",
      "U1000 4K Dash Cam",
      "Dash Cam 57",
    ],
  },
  {
    name: "Engine Oils",
    code: "EO",
    attribute: "Volume",
    variants: [
      { value: "1 L", price: 599,  compare: 799  },
      { value: "3 L", price: 1499, compare: 1999 },
      { value: "5 L", price: 2199, compare: 2999 },
    ],
    brands: ["Castrol", "Mobil 1", "Shell", "Gulf", "Motul", "Castrol", "Mobil 1", "Shell", "Gulf", "Liqui Moly"],
    products: [
      "EDGE 5W-30 Fully Synthetic",
      "ESP X3 0W-40 Synthetic",
      "Helix Ultra 5W-40 Synthetic",
      "Pride 4T Plus 20W-40",
      "3000 4T Plus 10W-40",
      "GTX ULTRACLEAN 15W-40",
      "Super 3000 X1 5W-40",
      "Advance AX7 10W-40",
      "Pride 4T 10W-30",
      "Leichtlauf HC7 5W-30",
    ],
  },
  {
    name: "Batteries",
    code: "BT",
    attribute: "Capacity",
    variants: [
      { value: "35 Ah", price: 2999, compare: 3999  },
      { value: "55 Ah", price: 4999, compare: 6499  },
      { value: "75 Ah", price: 7999, compare: 10499 },
    ],
    brands: ["Amaron", "Exide", "Bosch", "SF Sonic", "Tata Green", "Amaron", "Exide", "Bosch", "SF Sonic", "Okaya"],
    products: [
      "Pro Series Car Battery",
      "Matrix Car Battery",
      "S4 Maintenance-Free Battery",
      "Flash Start Car Battery",
      "GO Plus Car Battery",
      "FLO Car Battery",
      "Mileage Car Battery",
      "Silver S5 Car Battery",
      "Turbo FR Battery",
      "Power Forte Car Battery",
    ],
  },
  {
    name: "Body Covers",
    code: "BC",
    attribute: "Vehicle Type",
    variants: [
      { value: "Hatchback", price: 799,  compare: 1099 },
      { value: "Sedan",     price: 999,  compare: 1399 },
      { value: "SUV",       price: 1299, compare: 1799 },
    ],
    brands: ["CARBINIC", "AutoSun", "Solimo", "Covercraft", "HOUZE", "CARBINIC", "AutoSun", "Solimo", "Covercraft", "HOUZE"],
    products: [
      "Premium Waterproof Car Cover",
      "Mirror Pocket Car Cover",
      "All-Season Car Body Cover",
      "Noah Car Cover",
      "360 Degree Car Cover",
      "Silver Guard Car Cover",
      "Tri-Layer Car Cover",
      "All-Weather Car Cover",
      "WeatherShield HP Cover",
      "Indigo Shield Car Cover",
    ],
  },
  {
    name: "Helmets",
    code: "HM",
    attribute: "Size",
    variants: [
      { value: "M",  price: 1499, compare: 1999 },
      { value: "L",  price: 1499, compare: 1999 },
      { value: "XL", price: 1599, compare: 2099 },
    ],
    brands: ["Steelbird", "Vega", "LS2", "AGV", "Shoei", "HJC", "MT Helmets", "Arai", "Bell", "Studds"],
    products: [
      "SBH-17 Dashing Full Face Helmet",
      "Crux Motocross Helmet",
      "FF320 Stream Full Face Helmet",
      "K3 SV Multi Full Face Helmet",
      "Z-8 Full Face Helmet",
      "RPHA 12 Carbon Full Face Helmet",
      "Thunder 4 SV Full Face Helmet",
      "Profile-V Full Face Helmet",
      "Race Star Flex DLX Helmet",
      "Chrome Full Face Helmet",
    ],
  },
  {
    name: "Music Systems",
    code: "MS",
    attribute: "DIN Size",
    variants: [
      { value: "Single DIN", price: 3999, compare: 5499  },
      { value: "Double DIN", price: 7999, compare: 10999 },
    ],
    brands: ["Sony", "Pioneer", "JVC", "Kenwood", "Alpine", "Sony", "Pioneer", "JVC", "Kenwood", "Alpine"],
    products: [
      "DSX-GS80 Car Stereo",
      "MVH-S320BT Car Stereo",
      "KD-X172MBT Car Stereo",
      "KMM-BT305 Car Stereo",
      "UTE-73EBT Car Stereo",
      "XAV-AX100 Car Stereo",
      "AVH-Z5250BT Car Stereo",
      "KW-V350BT Car Stereo",
      "DDX9020DABS Car Stereo",
      "iLX-W650 Halo9 Car Stereo",
    ],
  },
  {
    name: "Lights",
    code: "LT",
    attribute: "Bulb Type",
    variants: [
      { value: "Halogen", price: 299,  compare: 499  },
      { value: "LED",     price: 799,  compare: 1099 },
      { value: "HID",     price: 1499, compare: 1999 },
    ],
    brands: ["Philips", "Osram", "PIAA", "Hella", "Bosch", "Philips", "Osram", "PIAA", "Hella", "Bosch"],
    products: [
      "Vision Plus H4 Headlight Bulb",
      "Night Breaker H7 Bulb",
      "X-treme Vision H4 Bulb",
      "90mm Bi-LED Module",
      "Plus 90 H7 Headlight Bulb",
      "Ultinon Pro6000 H4 LED",
      "LEDriving HL H4 LED",
      "GT-X5500K H4 HID Kit",
      "90mm LED Driving Light",
      "Gigalight Plus 120 H7 Bulb",
    ],
  },
  {
    name: "Seat Covers",
    code: "SC",
    attribute: "Vehicle Type",
    variants: [
      { value: "Hatchback", price: 1499, compare: 1999 },
      { value: "Sedan",     price: 2499, compare: 3299 },
      { value: "SUV",       price: 3499, compare: 4499 },
    ],
    brands: ["Elegant", "AutoSun", "Carmate", "Covercraft", "Seat Comfort", "Elegant", "AutoSun", "Carmate", "Covercraft", "Seat Comfort"],
    products: [
      "Roma Art Leatherette Seat Cover",
      "Polyester Car Seat Cover Set",
      "Beige Fabric Seat Cover",
      "Canteen Car Seat Cover",
      "NeoSupreme Seat Cover",
      "Milano Royal Seat Cover",
      "Sporty Seat Cover Set",
      "Beige Velvet Seat Cover",
      "SeatSaver Waterproof Cover",
      "Premier Leatherette Seat Cover",
    ],
  },
  {
    name: "Car Fresheners",
    code: "CF",
    attribute: "Format",
    variants: [
      { value: "Spray",     price: 199, compare: 299 },
      { value: "Gel",       price: 149, compare: 199 },
      { value: "Vent Clip", price: 99,  compare: 149 },
    ],
    brands: ["Ambi Pur", "Godrej", "Areon", "Little Trees", "Air Wick", "Ambi Pur", "Godrej", "Areon", "Little Trees", "Air Wick"],
    products: [
      "Car Air Freshener Spray",
      "Aer Power Car Freshener",
      "Car GOLD Air Freshener",
      "Original Black Ice Freshener",
      "Car Fresh Matic Kit",
      "Sport Berries Car Freshener",
      "Aer Click Car Freshener",
      "SPORT Lux Air Freshener",
      "New Car Scent Freshener",
      "Colour Therapy Car Freshener",
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [stores] = await sequelize.query(
    "SELECT id, name FROM stores WHERE name = 'Karto Main Store' LIMIT 1"
  ) as [Array<{ id: number; name: string }>, unknown];

  if (stores.length === 0) {
    console.error("Karto Main Store not found. Run seed.ts first.");
    process.exit(1);
  }

  console.log(`Seeding for store: "${stores[0]!.name}" (id=${stores[0]!.id})`);

  for (const store of stores) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`Store ${store.id} — ${store.name}`);
    console.log("═".repeat(50));

    // ── 1. Get created_by admin ─────────────────────────────────────────────
    const [admins] = await sequelize.query(
      "SELECT id FROM admins WHERE store_id = ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];

    if (admins.length === 0) {
      console.log(`  No admin found for store ${store.id}, skipping.`);
      continue;
    }
    const createdBy = admins[0]!.id;

    // ── 1b. Get outlet IDs ──────────────────────────────────────────────────
    const [outletRows] = await sequelize.query(
      "SELECT id FROM outlets WHERE store_id = ? AND is_deleted = 0",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];
    const outletIds = outletRows.map(o => o.id);
    console.log(`  Outlets: ${outletIds.join(", ")}`);

    // ── 2. Get brand IDs ────────────────────────────────────────────────────
    const [brandRows] = await sequelize.query(
      "SELECT id, name FROM brands WHERE is_deleted = 0 AND status = 1"
    ) as [Array<{ id: number; name: string }>, unknown];

    const brandMap = new Map<string, number>();
    for (const b of brandRows) brandMap.set(b.name, b.id);

    // ── 3. Get Automotive parent category ───────────────────────────────────
    const [automotiveRows] = await sequelize.query(
      "SELECT id FROM categories WHERE name = 'Automotive' AND store_id = ? AND parent_id IS NULL AND is_deleted = 0 LIMIT 1",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];

    if (automotiveRows.length === 0) {
      console.log(`  Automotive parent category not found for store ${store.id}. Run seedAutomotiveCategory.ts first.`);
      continue;
    }
    const automotiveId = automotiveRows[0]!.id;

    // ── 4. Get existing subcategories, create missing ones ──────────────────
    const [subRows] = await sequelize.query(
      "SELECT id, name FROM categories WHERE parent_id = ? AND store_id = ? AND is_deleted = 0",
      { replacements: [automotiveId, store.id] }
    ) as [Array<{ id: number; name: string }>, unknown];

    const subcategoryMap = new Map<string, number>();
    for (const s of subRows) subcategoryMap.set(s.name, s.id);

    for (const def of SUBCATEGORY_DATA) {
      if (!subcategoryMap.has(def.name)) {
        const slug = await uniqueCategorySlug(slugify(def.name));
        await sequelize.query(
          "INSERT INTO categories (name, slug, parent_id, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())",
          { replacements: [def.name, slug, automotiveId, store.id] }
        );
        const [inserted] = await sequelize.query(
          "SELECT id FROM categories WHERE name = ? AND store_id = ? AND parent_id = ? AND is_deleted = 0 LIMIT 1",
          { replacements: [def.name, store.id, automotiveId] }
        ) as [Array<{ id: number }>, unknown];
        subcategoryMap.set(def.name, inserted[0]!.id);
        console.log(`  Subcategory "${def.name}" (slug=${slug}): created (id=${inserted[0]!.id})`);
      }
    }

    // ── 5. Upsert variant attributes and their values ───────────────────────
    const allAttributes = [...new Set(SUBCATEGORY_DATA.map(d => d.attribute))];
    const allValues = new Map<string, Set<string>>();
    for (const def of SUBCATEGORY_DATA) {
      if (!allValues.has(def.attribute)) allValues.set(def.attribute, new Set());
      for (const v of def.variants) allValues.get(def.attribute)!.add(v.value);
    }

    const attrIdMap = new Map<string, number>();
    const attrValueIdMap = new Map<string, number>();

    for (const attrName of allAttributes) {
      const [existing] = await sequelize.query(
        "SELECT id FROM variant_attributes WHERE name = ? AND store_id = ? AND is_deleted = 0 LIMIT 1",
        { replacements: [attrName, store.id] }
      ) as [Array<{ id: number }>, unknown];

      let attrId: number;
      if (existing.length > 0) {
        attrId = existing[0]!.id;
        console.log(`  Attr "${attrName}": already exists (id=${attrId})`);
      } else {
        await sequelize.query(
          "INSERT INTO variant_attributes (name, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, 1, 0, NOW(), NOW())",
          { replacements: [attrName, store.id] }
        );
        const [inserted] = await sequelize.query(
          "SELECT id FROM variant_attributes WHERE name = ? AND store_id = ? AND is_deleted = 0 LIMIT 1",
          { replacements: [attrName, store.id] }
        ) as [Array<{ id: number }>, unknown];
        attrId = inserted[0]!.id;
        console.log(`  Attr "${attrName}": created (id=${attrId})`);
      }
      attrIdMap.set(attrName, attrId);

      for (const val of allValues.get(attrName)!) {
        const key = `${attrName}:${val}`;
        const [existingVal] = await sequelize.query(
          "SELECT id FROM variant_attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1",
          { replacements: [attrId, val] }
        ) as [Array<{ id: number }>, unknown];

        if (existingVal.length > 0) {
          attrValueIdMap.set(key, existingVal[0]!.id);
        } else {
          await sequelize.query(
            "INSERT INTO variant_attribute_values (attribute_id, value, sort_order, created_ts, updated_ts) VALUES (?, ?, 0, NOW(), NOW())",
            { replacements: [attrId, val] }
          );
          const [insertedVal] = await sequelize.query(
            "SELECT id FROM variant_attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1",
            { replacements: [attrId, val] }
          ) as [Array<{ id: number }>, unknown];
          attrValueIdMap.set(key, insertedVal[0]!.id);
          console.log(`    Value "${val}": created (id=${insertedVal[0]!.id})`);
        }
      }
    }

    // ── 6. Insert products ──────────────────────────────────────────────────
    for (let catIdx = 0; catIdx < SUBCATEGORY_DATA.length; catIdx++) {
      const def = SUBCATEGORY_DATA[catIdx]!;
      const categoryId = subcategoryMap.get(def.name);

      if (!categoryId) {
        console.log(`\n  Subcategory "${def.name}" not found, skipping.`);
        continue;
      }

      console.log(`\n  ── ${def.name} (category_id=${categoryId}) ──`);

      for (let prodIdx = 0; prodIdx < def.products.length; prodIdx++) {
        const productCode = `AUTO${def.code}${String(prodIdx + 1).padStart(2, "0")}`;
        const brandName = def.brands[prodIdx]!;
        const modelName = def.products[prodIdx]!;
        const productName = `${brandName} ${modelName}`;
        const brandId = brandMap.get(brandName) ?? null;

        // Check if already seeded
        const [existingProd] = await sequelize.query(
          "SELECT id FROM products WHERE product_code = ? LIMIT 1",
          { replacements: [productCode] }
        ) as [Array<{ id: number }>, unknown];

        if (existingProd.length > 0) {
          console.log(`    [SKIP] ${productCode} "${productName}" already exists`);
          continue;
        }

        const slug = await uniqueProductSlug(slugify(productName));
        const description = `${productName} — a quality automotive product from ${brandName}. Part of the ${def.name} category.`;

        await sequelize.query(
          `INSERT INTO products
             (product_code, name, description, category_id, store_id, brand_id, is_stockable,
              slug, status, is_draft, is_deleted, created_by, created_ts, updated_ts)
           VALUES (?, ?, ?, ?, NULL, ?, 1, ?, 1, 0, 0, ?, NOW(), NOW())`,
          { replacements: [productCode, productName, description, categoryId, brandId, slug, createdBy] }
        );

        const [insertedProd] = await sequelize.query(
          "SELECT id FROM products WHERE product_code = ? LIMIT 1",
          { replacements: [productCode] }
        ) as [Array<{ id: number }>, unknown];
        const productId = insertedProd[0]!.id;
        console.log(`    [NEW] ${productCode} "${productName}" (id=${productId})`);

        // Link product to all store outlets
        for (const outletId of outletIds) {
          await sequelize.query(
            "INSERT IGNORE INTO product_outlets (product_id, outlet_id) VALUES (?, ?)",
            { replacements: [productId, outletId] }
          );
        }

        // Insert variants
        for (let varIdx = 0; varIdx < def.variants.length; varIdx++) {
          const varDef = def.variants[varIdx]!;
          const sku = `${productCode}-V${varIdx + 1}`;
          const barcode = genBarcode(catIdx, prodIdx, varIdx);
          const attrKey = `${def.attribute}:${varDef.value}`;
          const attrValueId = attrValueIdMap.get(attrKey)!;
          const imgSeed = `karto-auto-${def.code.toLowerCase()}-${String(prodIdx + 1).padStart(2, "0")}-v${varIdx + 1}`;

          await sequelize.query(
            `INSERT INTO product_variants
               (product_id, sku, barcode, status, is_deleted, created_ts, updated_ts)
             VALUES (?, ?, ?, 1, 0, NOW(), NOW())`,
            { replacements: [productId, sku, barcode] }
          );

          const [insertedVar] = await sequelize.query(
            "SELECT id FROM product_variants WHERE sku = ? LIMIT 1",
            { replacements: [sku] }
          ) as [Array<{ id: number }>, unknown];
          const variantId = insertedVar[0]!.id;

          // Link variant to attribute value
          await sequelize.query(
            "INSERT INTO product_variant_options (variant_id, attribute_value_id) VALUES (?, ?)",
            { replacements: [variantId, attrValueId] }
          );

          // Insert media
          const filename = `${productCode.toLowerCase()}-v${varIdx + 1}.jpg`;
          await sequelize.query(
            `INSERT INTO media
               (filename, original_name, path, mime_type, size, store_id, created_ts, updated_ts)
             VALUES (?, ?, ?, 'image/jpeg', 0, ?, NOW(), NOW())`,
            { replacements: [filename, filename, imageUrl(imgSeed), store.id] }
          );

          const [insertedMedia] = await sequelize.query(
            "SELECT LAST_INSERT_ID() as id"
          ) as [Array<{ id: number }>, unknown];
          const mediaId = insertedMedia[0]!.id;

          // Link media to product + variant
          await sequelize.query(
            `INSERT INTO product_media
               (product_id, media_id, variant_id, sort_order, is_primary)
             VALUES (?, ?, ?, 0, 1)`,
            { replacements: [productId, mediaId, variantId] }
          );

          // Insert price
          await sequelize.query(
            `INSERT INTO product_prices
               (product_id, variant_id, price, compare_at_price, customer_group_id, outlet_id, created_ts, updated_ts)
             VALUES (?, ?, ?, ?, NULL, NULL, NOW(), NOW())`,
            { replacements: [productId, variantId, varDef.price, varDef.compare] }
          );

          console.log(`      variant ${sku} (${varDef.value}) ₹${varDef.price} — media id=${mediaId}`);
        }
      }
    }
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
