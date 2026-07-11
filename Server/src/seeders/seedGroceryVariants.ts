import sequelize from "../config/database";
import "../models/index";
import VariantAttribute from "../models/variantAttribute.model";
import VariantAttributeValue from "../models/variantAttributeValue.model";

// Grocery-relevant variant attributes with their values (in logical sort order)
const GROCERY_VARIANTS: Array<{ name: string; values: string[] }> = [
  {
    name: "Weight",
    values: [
      "25g", "50g", "75g", "100g", "150g", "200g", "250g",
      "400g", "500g", "750g",
      "1kg", "1.5kg", "2kg", "3kg", "5kg", "10kg", "25kg", "50kg",
    ],
  },
  {
    name: "Volume",
    values: [
      "50mL", "100mL", "150mL", "200mL", "250mL", "330mL",
      "400mL", "500mL", "600mL", "750mL", "1L", "1.5L", "2L", "3L", "5L",
    ],
  },
  {
    name: "Pack Size",
    values: [
      "1 Pc", "2 Pcs", "3 Pcs", "4 Pcs", "5 Pcs",
      "6 Pcs", "8 Pcs", "10 Pcs", "12 Pcs",
      "20 Pcs", "24 Pcs", "30 Pcs", "48 Pcs", "100 Pcs",
    ],
  },
  {
    name: "Pack Type",
    values: [
      "Sachet", "Pouch", "Bag", "Box", "Bottle",
      "Jar", "Can", "Tray", "Carton", "Tetra Pack", "Tube",
    ],
  },
  {
    name: "Count",
    values: [
      "6 Eggs", "12 Eggs", "30 Eggs",
      "1 Dozen", "2 Dozen",
      "4 Pieces", "6 Pieces", "8 Pieces",
    ],
  },
];

async function seedGroceryVariants() {
  await sequelize.authenticate();

  // Resolve store
  const [stores] = await sequelize.query(
    "SELECT id FROM stores ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];

  const storeId = stores[0]?.id;
  if (!storeId) {
    console.error("No store found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`Using store id=${storeId}\n`);

  // ── 1. Clear existing data (children first, then parents) ─────────────────
  console.log("Clearing existing variant data...");
  await sequelize.query("SET FOREIGN_KEY_CHECKS=0");
  await sequelize.query("TRUNCATE TABLE variant_attribute_values");
  await sequelize.query("TRUNCATE TABLE variant_attributes");
  await sequelize.query("SET FOREIGN_KEY_CHECKS=1");
  console.log("  ✓ Cleared variant_attribute_values");
  console.log("  ✓ Cleared variant_attributes\n");

  // ── 2. Insert grocery variants ────────────────────────────────────────────
  let totalValues = 0;

  for (const attr of GROCERY_VARIANTS) {
    const attribute = await VariantAttribute.create({
      name:       attr.name,
      store_id:   storeId,
      status:     true,
      is_deleted: false,
    });
    console.log(`  ✓ Attribute  [id=${attribute.id}] ${attr.name} (${attr.values.length} values)`);

    await VariantAttributeValue.bulkCreate(
      attr.values.map((value, idx) => ({
        attribute_id: attribute.id,
        value,
        sort_order:   idx + 1,
      }))
    );
    totalValues += attr.values.length;
  }

  console.log(`\nDone — ${GROCERY_VARIANTS.length} attributes, ${totalValues} values inserted.`);
  await sequelize.close();
}

seedGroceryVariants().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
