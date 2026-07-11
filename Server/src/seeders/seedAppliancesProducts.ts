/**
 * Seed: Add Appliances products — 10 per subcategory, each with variants, images, and prices.
 * Prerequisites: Run seedAppliancesCategory.ts and seedApplianceBrands.ts first.
 * Safe to re-run — skips any product whose product_code already exists.
 *
 * Run: npx tsx src/seeders/seedAppliancesProducts.ts
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

function genBarcode(catIdx: number, prodIdx: number, varIdx: number): string {
  const raw = `89${catIdx + 1}${String(prodIdx + 1).padStart(2, "0")}${varIdx + 1}000000`;
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
  code: string;       // product_code prefix, e.g. "WM"
  attribute: string;  // variant attribute name
  variants: VariantDef[];
  brands: string[];   // 10 entries (one per product)
  products: string[]; // 10 model name suffixes (appended after brand)
}

const SUBCATEGORY_DATA: SubcategoryDef[] = [
  {
    name: "Washing Machines",
    code: "WM",
    attribute: "Capacity",
    variants: [
      { value: "6 kg",  price: 9999,  compare: 12999 },
      { value: "7 kg",  price: 13999, compare: 17999 },
      { value: "8 kg",  price: 18999, compare: 24999 },
    ],
    brands:   ["LG", "Samsung", "Whirlpool", "Bosch", "Godrej", "Haier", "Voltas", "Bajaj", "LG", "Samsung"],
    products: [
      "FHM1006ADW Front Load",
      "WW70T4020EE Front Load",
      "SWFLT7212 Front Load",
      "WAJ24262IN Front Load",
      "GWMA7020PPD Semi-Auto",
      "HW70B14979 Front Load",
      "WFL70S Front Load",
      "WM7000 Fully Automatic",
      "P9042R3SM Semi-Auto",
      "WT80R4200YG Top Load",
    ],
  },
  {
    name: "Refrigerators",
    code: "RF",
    attribute: "Capacity",
    variants: [
      { value: "185 L", price: 10999, compare: 14499 },
      { value: "215 L", price: 16999, compare: 21999 },
      { value: "265 L", price: 24999, compare: 31999 },
    ],
    brands:   ["LG", "Samsung", "Whirlpool", "Godrej", "Haier", "Hitachi", "Voltas", "Bosch", "LG", "Samsung"],
    products: [
      "GL-B201APZY Direct Cool",
      "RR20T182XR2 Direct Cool",
      "205 IMFPB Direct Cool",
      "RB214B225 Single Door",
      "HRD2182BBS Single Door",
      "RL230PBD Single Door",
      "RR240D1110 Direct Cool",
      "KDN30NL201 Single Door",
      "GL-D201ABSY Direct Cool",
      "RR21T2G2W9R Single Door",
    ],
  },
  {
    name: "Air Conditioners",
    code: "AC",
    attribute: "Tonnage",
    variants: [
      { value: "1 Ton",   price: 28999, compare: 36999 },
      { value: "1.5 Ton", price: 37999, compare: 47999 },
      { value: "2 Ton",   price: 52999, compare: 67999 },
    ],
    brands:   ["LG", "Samsung", "Voltas", "Hitachi", "Haier", "Godrej", "LG", "Samsung", "Voltas", "Hitachi"],
    products: [
      "PS-Q12PNZE Dual Inverter",
      "AR12NV3REDY 3 Star Inverter",
      "183V DY1 3 Star Inverter",
      "RSB322HBEA 3 Star Inverter",
      "HU12EF Turbo Cool",
      "GIC 12LCG Inverter",
      "PS-Q18PNZE Dual Inverter",
      "AR18NV3REDY 5 Star Inverter",
      "183 DYa 5 Star Inverter",
      "RSB422HBEA 5 Star Inverter",
    ],
  },
  {
    name: "Microwave Ovens",
    code: "MW",
    attribute: "Capacity",
    variants: [
      { value: "20 L", price: 4499,  compare: 5999 },
      { value: "25 L", price: 7999,  compare: 10499 },
      { value: "30 L", price: 12999, compare: 16999 },
    ],
    brands:   ["LG", "Samsung", "Bajaj", "Bosch", "Whirlpool", "Godrej", "LG", "Samsung", "Bajaj", "Bosch"],
    products: [
      "MH2044DB Solo",
      "MS23K3515AK Solo",
      "VACCO20 Solo",
      "HMT75G451B Solo",
      "Magicook 20C Solo",
      "GMX20CA5MLZ Grill",
      "MC2146BV Convection",
      "MS28F303TAS Convection",
      "MTBX25 Grill",
      "HBC84H7501 Convection",
    ],
  },
  {
    name: "Televisions",
    code: "TV",
    attribute: "Screen Size",
    variants: [
      { value: "32 inch", price: 13999, compare: 17999 },
      { value: "43 inch", price: 29999, compare: 38999 },
      { value: "55 inch", price: 49999, compare: 64999 },
    ],
    brands:   ["LG", "Samsung", "Philips", "Haier", "LG", "Samsung", "Philips", "Haier", "LG", "Samsung"],
    products: [
      "32LM563BPTC HD Ready Smart",
      "UA32T4380AK HD Ready Smart",
      "32PHT4233 HD Ready",
      "32K6600GG HD Smart",
      "43LM5600PTC Full HD Smart",
      "UA43T5350AK Full HD Smart",
      "43PFS5505 Full HD",
      "43K6600GG 4K Smart",
      "55NANO75TPA 4K NanoCell",
      "UA55AU7700 4K Crystal UHD",
    ],
  },
  {
    name: "Air Purifiers",
    code: "AP",
    attribute: "Coverage",
    variants: [
      { value: "Small Room",  price: 5999,  compare: 7999 },
      { value: "Medium Room", price: 11999, compare: 15999 },
      { value: "Large Room",  price: 18999, compare: 24999 },
    ],
    brands:   ["Philips", "Dyson", "LG", "Philips", "Dyson", "LG", "Philips", "Dyson", "LG", "Philips"],
    products: [
      "AC1215 Air Purifier",
      "BP01 Pure Cool Me",
      "AS65GDXE0 PuriCare",
      "AC2887 Air Purifier",
      "TP04 Pure Cool",
      "AS95GDWV0 PuriCare",
      "AC3858 Air Purifier",
      "HP04 Pure Hot+Cool",
      "AS60GDWV0 PuriCare",
      "AC4236 Air Purifier",
    ],
  },
  {
    name: "Water Purifiers",
    code: "WP",
    attribute: "Type",
    variants: [
      { value: "RO",    price: 6999,  compare: 8999 },
      { value: "UV",    price: 4999,  compare: 6499 },
      { value: "RO+UV", price: 11999, compare: 15499 },
    ],
    brands:   ["Kent", "Whirlpool", "Philips", "Bajaj", "Kent", "Whirlpool", "Philips", "Bajaj", "Kent", "Whirlpool"],
    products: [
      "Grand Plus RO Purifier",
      "Purofresh RO Purifier",
      "ADD6910 RO Purifier",
      "Majesty Purity Purifier",
      "Prime Plus RO Purifier",
      "Purite RO Purifier",
      "ADD6930 RO Purifier",
      "Nova Water Purifier",
      "Ace Mineral RO Purifier",
      "Classic Plus RO Purifier",
    ],
  },
  {
    name: "Geysers",
    code: "GY",
    attribute: "Capacity",
    variants: [
      { value: "6 L",  price: 3499, compare: 4499 },
      { value: "10 L", price: 5499, compare: 7199 },
      { value: "15 L", price: 7999, compare: 10499 },
    ],
    brands:   ["Bajaj", "Bosch", "Philips", "Godrej", "Bajaj", "Bosch", "Philips", "Godrej", "Bajaj", "Bosch"],
    products: [
      "Calenta Storage Water Heater",
      "Tronic 2000T Water Heater",
      "AWH1032 Instant Water Heater",
      "GWFRG6LPCOBK Water Heater",
      "Shakti Plus Storage Heater",
      "Tronic 3000B Water Heater",
      "AWH1042 Instant Water Heater",
      "GWFRG10LPCOBK Water Heater",
      "New Shakti Storage Heater",
      "Tronic 5000B Water Heater",
    ],
  },
  {
    name: "Vacuum Cleaners",
    code: "VC",
    attribute: "Type",
    variants: [
      { value: "Dry",      price: 3999, compare: 5299 },
      { value: "Wet & Dry", price: 7999, compare: 10499 },
    ],
    brands:   ["Dyson", "Philips", "LG", "Bosch", "Dyson", "Philips", "LG", "Bosch", "Dyson", "Philips"],
    products: [
      "V8 Absolute Cord-free",
      "PowerPro FC9352 Bagless",
      "VK7920NNTG CordZero",
      "BCH6ATH25K Cordless",
      "V10 Motorhead Cord-free",
      "PowerPro FC9728 Bagless",
      "VK5820NNTG CordZero",
      "BSG6A212 Vacuum Cleaner",
      "V11 Torque Drive",
      "PowerPro FC9330 Cyclonic",
    ],
  },
  {
    name: "Mixer Grinders",
    code: "MG",
    attribute: "Power",
    variants: [
      { value: "500 W",  price: 2199, compare: 2999 },
      { value: "750 W",  price: 3799, compare: 4999 },
      { value: "1000 W", price: 5999, compare: 7799 },
    ],
    brands:   ["Bajaj", "Philips", "Bosch", "Godrej", "Bajaj", "Philips", "Bosch", "Godrej", "Bajaj", "Philips"],
    products: [
      "Pluto DX Mixer Grinder",
      "HL7707 Mixer Grinder",
      "TrueMixx Pro Mixer Grinder",
      "GKOTTO Mixer Grinder",
      "Bravo DX Mixer Grinder",
      "HL7756 Mixer Grinder",
      "TrueMixx Joy Mixer Grinder",
      "GMX Mixer Grinder",
      "Rex Platinum Mixer Grinder",
      "HL7715 Mixer Grinder",
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [stores] = await sequelize.query(
    "SELECT id, name FROM stores WHERE name = 'Groco Main Store' LIMIT 1"
  ) as [Array<{ id: number; name: string }>, unknown];

  if (stores.length === 0) {
    console.error("Groco Main Store not found. Run seed.ts first.");
    process.exit(1);
  }

  console.log(`Seeding for store: "${stores[0]!.name}" (id=${stores[0]!.id})`);

  for (const store of stores) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`Store ${store.id} — ${store.name}`);
    console.log("═".repeat(50));

    // ── 1. Get created_by admin for this store ──────────────────────────────
    const [admins] = await sequelize.query(
      "SELECT id FROM admins WHERE store_id = ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];

    if (admins.length === 0) {
      console.log(`  No admin found for store ${store.id}, skipping.`);
      continue;
    }
    const createdBy = admins[0]!.id;

    // ── 1b. Get outlet IDs for this store ───────────────────────────────────
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

    // ── 3. Get subcategory IDs ──────────────────────────────────────────────
    const [appliancesRows] = await sequelize.query(
      "SELECT id FROM categories WHERE name = 'Appliances' AND store_id = ? AND parent_id IS NULL AND is_deleted = 0 LIMIT 1",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];

    if (appliancesRows.length === 0) {
      console.log(`  Appliances parent category not found for store ${store.id}. Run seedAppliancesCategory.ts first.`);
      continue;
    }
    const appliancesId = appliancesRows[0]!.id;

    const [subRows] = await sequelize.query(
      "SELECT id, name FROM categories WHERE parent_id = ? AND store_id = ? AND is_deleted = 0",
      { replacements: [appliancesId, store.id] }
    ) as [Array<{ id: number; name: string }>, unknown];

    const subcategoryMap = new Map<string, number>();
    for (const s of subRows) subcategoryMap.set(s.name, s.id);

    // ── 4. Upsert variant attributes and their values ───────────────────────
    const allAttributes = [...new Set(SUBCATEGORY_DATA.map(d => d.attribute))];
    const allValues = new Map<string, Set<string>>();
    for (const def of SUBCATEGORY_DATA) {
      if (!allValues.has(def.attribute)) allValues.set(def.attribute, new Set());
      for (const v of def.variants) allValues.get(def.attribute)!.add(v.value);
    }

    // Map: attributeName → id
    const attrIdMap = new Map<string, number>();
    // Map: "attributeName:value" → attributeValueId
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

      // Upsert attribute values
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

    // ── 5. Insert products ──────────────────────────────────────────────────
    for (let catIdx = 0; catIdx < SUBCATEGORY_DATA.length; catIdx++) {
      const def = SUBCATEGORY_DATA[catIdx]!;
      const categoryId = subcategoryMap.get(def.name);

      if (!categoryId) {
        console.log(`\n  Subcategory "${def.name}" not found, skipping.`);
        continue;
      }

      console.log(`\n  ── ${def.name} (category_id=${categoryId}) ──`);

      for (let prodIdx = 0; prodIdx < def.products.length; prodIdx++) {
        const productCode = `APPL${def.code}${String(prodIdx + 1).padStart(2, "0")}`;
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
        const description = `${productName} — a reliable home appliance from ${brandName}. Part of the ${def.name} category.`;

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
          const imgSeed = `groco-${def.code.toLowerCase()}-${String(prodIdx + 1).padStart(2, "0")}-v${varIdx + 1}`;

          // Insert variant
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

          // Insert media (image URL in path field)
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

          // Link media to product+variant
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
