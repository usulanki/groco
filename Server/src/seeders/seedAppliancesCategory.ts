/**
 * Seed: Add "Appliances" parent category and its subcategories for all stores.
 * Safe to re-run — skips if already exists.
 *
 * Run: npx tsx src/seeders/seedAppliancesCategory.ts
 */
import sequelize from "../config/database";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, storeId: number): Promise<string> {
  const [rows] = await sequelize.query(
    "SELECT id FROM categories WHERE slug = ? LIMIT 1",
    { replacements: [base] }
  ) as [Array<{ id: number }>, unknown];
  if (rows.length === 0) return base;
  return `${base}-s${storeId}`;
}

const SUBCATEGORIES = [
  "Washing Machines",
  "Refrigerators",
  "Air Conditioners",
  "Microwave Ovens",
  "Televisions",
  "Air Purifiers",
  "Water Purifiers",
  "Geysers",
  "Vacuum Cleaners",
  "Mixer Grinders",
];

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  const [stores] = await sequelize.query(
    "SELECT id FROM stores ORDER BY id ASC"
  ) as [Array<{ id: number }>, unknown];

  console.log(`Stores found: ${stores.map(s => s.id).join(", ")}`);

  for (const store of stores) {
    console.log(`\n── Store ${store.id} ──`);

    // 1. Upsert Appliances parent category
    const [existing] = await sequelize.query(
      "SELECT id FROM categories WHERE name = 'Appliances' AND store_id = ? AND parent_id IS NULL AND is_deleted = 0",
      { replacements: [store.id] }
    ) as [Array<{ id: number }>, unknown];

    let parentId: number;
    if (existing.length > 0) {
      parentId = existing[0]!.id;
      console.log(`  Category "Appliances": already exists (id=${parentId})`);
    } else {
      const slug = await uniqueSlug(slugify("Appliances"), store.id);
      await sequelize.query(
        "INSERT INTO categories (name, slug, parent_id, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, NULL, ?, 1, 0, NOW(), NOW())",
        { replacements: ["Appliances", slug, store.id] }
      );
      const [inserted] = await sequelize.query(
        "SELECT id FROM categories WHERE name = 'Appliances' AND store_id = ? AND parent_id IS NULL AND is_deleted = 0 LIMIT 1",
        { replacements: [store.id] }
      ) as [Array<{ id: number }>, unknown];
      parentId = inserted[0]!.id;
      console.log(`  Category "Appliances" (slug=${slug}): created (id=${parentId})`);
    }

    // 2. Upsert each subcategory
    for (const subName of SUBCATEGORIES) {
      const [existingSub] = await sequelize.query(
        "SELECT id FROM categories WHERE name = ? AND store_id = ? AND parent_id = ? AND is_deleted = 0",
        { replacements: [subName, store.id, parentId] }
      ) as [Array<{ id: number }>, unknown];

      if (existingSub.length > 0) {
        console.log(`  Sub-category "${subName}": already exists (id=${existingSub[0]!.id})`);
      } else {
        const slug = await uniqueSlug(slugify(subName), store.id);
        await sequelize.query(
          "INSERT INTO categories (name, slug, parent_id, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())",
          { replacements: [subName, slug, parentId, store.id] }
        );
        const [insertedSub] = await sequelize.query(
          "SELECT id FROM categories WHERE name = ? AND store_id = ? AND parent_id = ? AND is_deleted = 0 LIMIT 1",
          { replacements: [subName, store.id, parentId] }
        ) as [Array<{ id: number }>, unknown];
        console.log(`  Sub-category "${subName}" (slug=${slug}): created (id=${insertedSub[0]!.id})`);
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
