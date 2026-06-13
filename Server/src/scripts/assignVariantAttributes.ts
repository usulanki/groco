/**
 * Script: Assign variant attributes to all existing product variants.
 *
 * 1. Creates new variant attributes (Size, Color, Storage, Volume) if they don't exist
 * 2. Maps each product category to an appropriate attribute + 2 values
 * 3. Assigns those values to the 2 existing variants per product
 * 4. Sets sku_group to product_code so variants are grouped correctly
 *
 * Appliance categories reuse existing attributes (Capacity, Tonnage, etc.)
 *
 * Run: npx tsx src/scripts/assignVariantAttributes.ts
 */
import sequelize from "../config/database";

const STORE_ID = 1;

// ── Attribute definitions to create if missing ─────────────────────────────

const ATTRS_TO_CREATE = [
  { name: "Size",    values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Color",   values: ["Black", "White", "Blue", "Red", "Green", "Silver", "Gold", "Pink"] },
  { name: "Storage", values: ["64 GB", "128 GB", "256 GB", "512 GB"] },
  { name: "Volume",  values: ["50 ml", "100 ml", "200 ml", "500 ml"] },
];

// ── Category → { attribute name, [value for V1, value for V2] } ─────────────

const CATEGORY_ATTR_MAP: Record<number, { attr: string; values: [string, string] }> = {
  // Fashion
  1:   { attr: "Size",    values: ["S",      "M"]         },
  // Mobiles
  11:  { attr: "Storage", values: ["64 GB",  "128 GB"]    },
  // Beauty
  19:  { attr: "Volume",  values: ["100 ml", "200 ml"]    },
  // Electronics
  26:  { attr: "Color",   values: ["Black",  "White"]     },
  // Home
  36:  { attr: "Color",   values: ["Black",  "White"]     },
  // Baby Products
  57:  { attr: "Size",    values: ["S",      "M"]         },
  // Sportsddd
  63:  { attr: "Size",    values: ["S",      "M"]         },
  // Automotive
  80:  { attr: "Color",   values: ["Black",  "White"]     },

  // Appliances subcategories (parent 100) — reuse existing attributes
  101: { attr: "Capacity",    values: ["8 kg",      "7 kg"]        }, // Washing Machines
  102: { attr: "Capacity",    values: ["265 L",     "215 L"]       }, // Refrigerators
  103: { attr: "Tonnage",     values: ["1 Ton",     "1.5 Ton"]     }, // Air Conditioners
  104: { attr: "Capacity",    values: ["20 L",      "30 L"]        }, // Microwave Ovens
  105: { attr: "Screen Size", values: ["32 inch",   "43 inch"]     }, // Televisions
  106: { attr: "Coverage",    values: ["Small Room","Medium Room"] }, // Air Purifiers
  107: { attr: "Type",        values: ["RO",        "UV"]          }, // Water Purifiers
  108: { attr: "Capacity",    values: ["6 L",       "10 L"]        }, // Geysers
  109: { attr: "Power",       values: ["750 W",     "1000 W"]      }, // Vacuum Cleaners
  110: { attr: "Power",       values: ["500 W",     "750 W"]       }, // Mixer Grinders
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateAttribute(name: string): Promise<number> {
  const [rows] = await sequelize.query(
    "SELECT id FROM variant_attributes WHERE name = ? AND store_id = ? AND is_deleted = 0 LIMIT 1",
    { replacements: [name, STORE_ID] }
  ) as [Array<{ id: number }>, unknown];
  if (rows[0]) return rows[0].id;

  const [insertId] = await sequelize.query(
    "INSERT INTO variant_attributes (name, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, 1, 0, NOW(), NOW())",
    { replacements: [name, STORE_ID] }
  ) as unknown as [number, unknown];
  console.log(`  Created attribute: ${name} (id=${insertId})`);
  return insertId;
}

async function getOrCreateValue(attributeId: number, value: string, sortOrder: number): Promise<number> {
  const [rows] = await sequelize.query(
    "SELECT id FROM variant_attribute_values WHERE attribute_id = ? AND value = ? LIMIT 1",
    { replacements: [attributeId, value] }
  ) as [Array<{ id: number }>, unknown];
  if (rows[0]) return rows[0].id;

  const [insertId] = await sequelize.query(
    "INSERT INTO variant_attribute_values (attribute_id, value, sort_order, created_ts, updated_ts) VALUES (?, ?, ?, NOW(), NOW())",
    { replacements: [attributeId, value, sortOrder] }
  ) as unknown as [number, unknown];
  return insertId;
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.\n");

    // Step 1: Create missing attributes and their values
    console.log("=== Step 1: Creating variant attributes ===");
    const attrValueIds: Record<string, Record<string, number>> = {};

    for (const { name, values } of ATTRS_TO_CREATE) {
      const attrId = await getOrCreateAttribute(name);
      attrValueIds[name] = {};
      for (let i = 0; i < values.length; i++) {
        const valueId = await getOrCreateValue(attrId, values[i]!, i);
        attrValueIds[name][values[i]!] = valueId;
      }
    }

    // Also load existing attribute value IDs for appliance attrs
    const existingAttrNames = ["Capacity", "Tonnage", "Screen Size", "Coverage", "Type", "Power"];
    for (const name of existingAttrNames) {
      const [attrRows] = await sequelize.query(
        "SELECT id FROM variant_attributes WHERE name = ? AND store_id = ? AND is_deleted = 0 LIMIT 1",
        { replacements: [name, STORE_ID] }
      ) as [Array<{ id: number }>, unknown];
      if (!attrRows[0]) continue;
      const attrId = attrRows[0].id;
      const [valRows] = await sequelize.query(
        "SELECT id, value FROM variant_attribute_values WHERE attribute_id = ?",
        { replacements: [attrId] }
      ) as [Array<{ id: number; value: string }>, unknown];
      attrValueIds[name] = {};
      for (const row of valRows) {
        attrValueIds[name]![row.value] = row.id;
      }
    }

    // Step 2: Assign attributes to product variants
    console.log("\n=== Step 2: Assigning attributes to variants ===");

    const [products] = await sequelize.query(
      "SELECT id, product_code, name, category_id FROM products WHERE is_deleted = 0 ORDER BY id ASC"
    ) as [Array<{ id: number; product_code: string; name: string; category_id: number }>, unknown];

    let assigned = 0;
    let skipped = 0;

    for (const product of products) {
      const mapping = CATEGORY_ATTR_MAP[product.category_id];
      if (!mapping) {
        console.log(`  SKIP [${product.id}] "${product.name}" — no mapping for category_id ${product.category_id}`);
        skipped++;
        continue;
      }

      // Get the 2 variants ordered by id
      const [variants] = await sequelize.query(
        "SELECT id FROM product_variants WHERE product_id = ? AND is_deleted = 0 ORDER BY id ASC LIMIT 2",
        { replacements: [product.id] }
      ) as [Array<{ id: number }>, unknown];

      if (variants.length === 0) {
        console.log(`  SKIP [${product.id}] "${product.name}" — no variants`);
        skipped++;
        continue;
      }

      const attrName = mapping.attr;
      const attrValues = mapping.values;

      for (let i = 0; i < variants.length && i < 2; i++) {
        const variantId = variants[i]!.id;
        const valueName = attrValues[i as 0 | 1];
        const valueId   = attrValueIds[attrName]?.[valueName];

        if (!valueId) {
          console.log(`  WARN: value "${valueName}" not found for attribute "${attrName}"`);
          continue;
        }

        // Remove existing attribute options (avoid duplicates on re-run)
        await sequelize.query(
          `DELETE pvo FROM product_variant_options pvo
           JOIN variant_attribute_values vav ON vav.id = pvo.attribute_value_id
           JOIN variant_attributes va ON va.id = vav.attribute_id
           WHERE pvo.variant_id = ? AND va.name = ?`,
          { replacements: [variantId, attrName] }
        );

        // Insert new option
        await sequelize.query(
          "INSERT IGNORE INTO product_variant_options (variant_id, attribute_value_id) VALUES (?, ?)",
          { replacements: [variantId, valueId] }
        );

        // Update sku_group to product_code so variants are grouped in edit page
        await sequelize.query(
          "UPDATE product_variants SET sku_group = ? WHERE id = ?",
          { replacements: [product.product_code, variantId] }
        );
      }

      console.log(`  [${product.id}] "${product.name}" → ${attrName}: ${attrValues[0]} / ${attrValues[1] ?? '—'}`);
      assigned++;
    }

    console.log(`\nDone. Assigned attributes to ${assigned} products. Skipped ${skipped}.`);
    await sequelize.close();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
