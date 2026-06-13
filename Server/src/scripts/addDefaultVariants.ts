/**
 * Script: Add 2 default variants to every product that has fewer than 2.
 * - Products with 0 variants → 2 variants created
 * - Products with 1 variant  → 1 more variant created
 * - Products with 2+ variants → skipped
 *
 * Variants are "default" (no attribute values). SKUs are auto-generated
 * from the product_code to ensure uniqueness.
 *
 * Run: npx tsx src/scripts/addDefaultVariants.ts
 */
import sequelize from "../config/database";

const TARGET_VARIANTS = 2;

function generateBarcode(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]!) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

async function uniqueBarcode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const barcode = generateBarcode();
    const [rows] = await sequelize.query(
      "SELECT id FROM product_variants WHERE barcode = ? LIMIT 1",
      { replacements: [barcode] }
    ) as [Array<{ id: number }>, unknown];
    if (rows.length === 0) return barcode;
  }
  throw new Error("Could not generate unique barcode after 20 attempts");
}

async function uniqueSku(productCode: string, index: number): Promise<string> {
  const base = `${productCode}-V${index}`;
  let sku = base;
  let counter = 1;
  while (true) {
    const [rows] = await sequelize.query(
      "SELECT id FROM product_variants WHERE sku = ? LIMIT 1",
      { replacements: [sku] }
    ) as [Array<{ id: number }>, unknown];
    if (rows.length === 0) return sku;
    sku = `${base}-${counter++}`;
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    // Fetch all non-deleted products
    const [products] = await sequelize.query(
      "SELECT id, product_code, name FROM products WHERE is_deleted = 0 ORDER BY id ASC"
    ) as [Array<{ id: number; product_code: string; name: string }>, unknown];

    console.log(`Found ${products.length} products. Processing…\n`);

    let created = 0;
    let skipped = 0;

    for (const product of products) {
      // Count existing non-deleted variants
      const [variantRows] = await sequelize.query(
        "SELECT id FROM product_variants WHERE product_id = ? AND is_deleted = 0",
        { replacements: [product.id] }
      ) as [Array<{ id: number }>, unknown];

      const existing = variantRows.length;

      if (existing >= TARGET_VARIANTS) {
        skipped++;
        continue;
      }

      const toCreate = TARGET_VARIANTS - existing;
      const startIndex = existing + 1;

      for (let i = 0; i < toCreate; i++) {
        const variantIndex = startIndex + i;
        const sku = await uniqueSku(product.product_code, variantIndex);
        const barcode = await uniqueBarcode();

        await sequelize.query(
          `INSERT INTO product_variants (product_id, sku, sku_group, barcode, status, is_deleted, created_ts, updated_ts)
           VALUES (?, ?, NULL, ?, 1, 0, NOW(), NOW())`,
          { replacements: [product.id, sku, barcode] }
        );

        created++;
        console.log(`  [${product.id}] "${product.name}" → created variant #${variantIndex} (SKU: ${sku})`);
      }
    }

    console.log(`\nDone. Created ${created} variant(s). Skipped ${skipped} product(s) that already had ${TARGET_VARIANTS}+ variants.`);
    await sequelize.close();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
