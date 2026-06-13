/**
 * Seed: Add global automotive brands to the brands table.
 * Safe to re-run — skips if brand name already exists.
 *
 * Run: npx tsx src/seeders/seedAutomotiveBrands.ts
 */
import sequelize from "../config/database";

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const [rows] = await sequelize.query(
    "SELECT id FROM brands WHERE slug = ? LIMIT 1",
    { replacements: [base] }
  ) as [Array<{ id: number }>, unknown];
  if (rows.length === 0) return base;
  return `${base}-brand`;
}

const BRANDS = [
  // Tyres
  "MRF",
  "Apollo",
  "CEAT",
  "Bridgestone",
  "JK Tyre",
  "Michelin",
  "Goodyear",
  "TVS Eurogrip",
  "Maxxis",
  "Continental",
  // Cleaning
  "3M",
  "Meguiar's",
  "Turtle Wax",
  "WD-40",
  "Sonax",
  // Dashcam
  "Qubo",
  "70mai",
  "Viofo",
  "Garmin",
  "BlackVue",
  "Nextbase",
  "DDPai",
  "Vantrue",
  "Thinkware",
  // Engine Oils
  "Castrol",
  "Mobil 1",
  "Shell",
  "Gulf",
  "Motul",
  "Liqui Moly",
  // Batteries
  "Amaron",
  "Exide",
  "SF Sonic",
  "Tata Green",
  "Okaya",
  // Body Covers
  "CARBINIC",
  "AutoSun",
  "Solimo",
  "Covercraft",
  "HOUZE",
  // Helmets
  "Steelbird",
  "Vega",
  "LS2",
  "AGV",
  "Shoei",
  "HJC",
  "MT Helmets",
  "Arai",
  "Bell",
  "Studds",
  // Music Systems
  "Sony",
  "Pioneer",
  "JVC",
  "Kenwood",
  "Alpine",
  // Lights
  "Osram",
  "PIAA",
  "Hella",
  // Seat Covers
  "Elegant",
  "Carmate",
  "Seat Comfort",
  // Car Fresheners
  "Ambi Pur",
  "Godrej",
  "Areon",
  "Little Trees",
  "Air Wick",
];

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  for (const brandName of BRANDS) {
    const [existing] = await sequelize.query(
      "SELECT id FROM brands WHERE name = ? AND is_deleted = 0 LIMIT 1",
      { replacements: [brandName] }
    ) as [Array<{ id: number }>, unknown];

    if (existing.length > 0) {
      console.log(`Brand "${brandName}": already exists (id=${existing[0]!.id})`);
    } else {
      const slug = await uniqueSlug(slugify(brandName));
      await sequelize.query(
        "INSERT INTO brands (name, slug, type, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?, ?, 'global', NULL, 1, 0, NOW(), NOW())",
        { replacements: [brandName, slug] }
      );
      const [inserted] = await sequelize.query(
        "SELECT id FROM brands WHERE name = ? AND is_deleted = 0 LIMIT 1",
        { replacements: [brandName] }
      ) as [Array<{ id: number }>, unknown];
      console.log(`Brand "${brandName}" (slug=${slug}): created (id=${inserted[0]!.id})`);
    }
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
