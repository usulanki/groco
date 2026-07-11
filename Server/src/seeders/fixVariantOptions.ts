/**
 * Fix variants that ended up with 2 attribute values instead of 1.
 *
 * This happened when seedGroceryProducts ran before seedGroceryVariants truncated
 * and re-created variant_attribute_values, leaving old IDs in product_variant_options
 * that now pointed to wrong values. A second run of seedGroceryProducts then added
 * the correct IDs, resulting in 2 options per variant.
 *
 * This script ensures every product variant has exactly the one attribute value
 * that matches its position (V1 → first variant in category, V2 → second, etc.).
 */
import sequelize from "../config/database";
import "../models/index";

// Mirrors the variant definitions in seedGroceryProducts.ts
interface V { value: string; }
interface Cat { slug: string; code: string; attribute: string; variants: V[]; }

const DATA: Cat[] = [
  { slug: "fruits-vegetables-fresh-fruits",        code: "FRF", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "fruits-vegetables-fresh-vegetables",    code: "FRV", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "fruits-vegetables-exotic-organic",      code: "EXO", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "fruits-vegetables-herbs-seasonings",    code: "HRB", attribute: "Weight",    variants: [{ value: "50g"  }, { value: "100g" }] },
  { slug: "fruits-vegetables-cut-ready-to-cook",   code: "CRC", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dairy-bread-eggs-milk",                 code: "MLK", attribute: "Volume",    variants: [{ value: "500mL" }, { value: "1L" }] },
  { slug: "dairy-bread-eggs-curd-yogurt",          code: "CYG", attribute: "Weight",    variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "dairy-bread-eggs-butter-ghee",          code: "BTG", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "dairy-bread-eggs-paneer-tofu",          code: "PNT", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "dairy-bread-eggs-cheese",               code: "CHS", attribute: "Weight",    variants: [{ value: "200g" }, { value: "400g" }] },
  { slug: "dairy-bread-eggs-eggs",                 code: "EGG", attribute: "Count",     variants: [{ value: "6 Eggs" }, { value: "12 Eggs" }] },
  { slug: "dairy-bread-eggs-bread-pav",            code: "BRD", attribute: "Pack Size", variants: [{ value: "6 Pcs" }, { value: "12 Pcs" }] },
  { slug: "atta-rice-dal-wheat-flour-atta",        code: "ATT", attribute: "Weight",    variants: [{ value: "5kg" }, { value: "10kg" }] },
  { slug: "atta-rice-dal-rice",                    code: "RCE", attribute: "Weight",    variants: [{ value: "5kg" }, { value: "10kg" }] },
  { slug: "atta-rice-dal-pulses-lentils",          code: "PLG", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "atta-rice-dal-quinoa-millets",          code: "QNM", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "atta-rice-dal-semolina-flours",         code: "SML", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "masala-oil-spices-cooking-oil",         code: "OIL", attribute: "Volume",    variants: [{ value: "1L" }, { value: "5L" }] },
  { slug: "masala-oil-spices-whole-spices",        code: "WSP", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "masala-oil-spices-ground-spices",       code: "GSP", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "masala-oil-spices-salt-sugar",          code: "SLT", attribute: "Weight",    variants: [{ value: "1kg" }, { value: "5kg" }] },
  { slug: "masala-oil-spices-vinegar-preservatives", code: "VNP", attribute: "Volume",  variants: [{ value: "500mL" }, { value: "1L" }] },
  { slug: "masala-oil-spices-condiments",          code: "CDM", attribute: "Weight",    variants: [{ value: "200g" }, { value: "400g" }] },
  { slug: "snacks-munchies-chips-crisps",          code: "CHP", attribute: "Weight",    variants: [{ value: "50g" }, { value: "200g" }] },
  { slug: "snacks-munchies-namkeen-bhujia",        code: "NMK", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "snacks-munchies-popcorn",               code: "PPC", attribute: "Weight",    variants: [{ value: "50g" }, { value: "150g" }] },
  { slug: "snacks-munchies-peanuts-seeds",         code: "PNS", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "snacks-munchies-protein-bars",          code: "PRB", attribute: "Weight",    variants: [{ value: "50g" }, { value: "200g" }] },
  { slug: "snacks-munchies-crackers",              code: "CRK", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "beverages-cold-drinks-sodas",           code: "CLD", attribute: "Volume",    variants: [{ value: "330mL" }, { value: "2L" }] },
  { slug: "beverages-juices-nectars",              code: "JUC", attribute: "Volume",    variants: [{ value: "200mL" }, { value: "1L" }] },
  { slug: "beverages-water-sparkling",             code: "WAT", attribute: "Volume",    variants: [{ value: "500mL" }, { value: "1L" }] },
  { slug: "beverages-energy-drinks",               code: "ENR", attribute: "Volume",    variants: [{ value: "250mL" }, { value: "330mL" }] },
  { slug: "beverages-milkshakes-smoothies",        code: "MKS", attribute: "Volume",    variants: [{ value: "200mL" }, { value: "500mL" }] },
  { slug: "tea-coffee-health-drinks-tea",          code: "TEA", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "tea-coffee-health-drinks-coffee",       code: "COF", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "tea-coffee-health-drinks-health-nutrition-drinks", code: "HND", attribute: "Weight", variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "tea-coffee-health-drinks-green-tea-herbal", code: "GRT", attribute: "Pack Size", variants: [{ value: "20 Pcs" }, { value: "30 Pcs" }] },
  { slug: "tea-coffee-health-drinks-cocoa-malted-drinks", code: "CCM", attribute: "Weight", variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "breakfast-cereals-oats-cornflakes",     code: "OAT", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "breakfast-cereals-muesli-granola",      code: "MUG", attribute: "Weight",    variants: [{ value: "400g" }, { value: "750g" }] },
  { slug: "breakfast-cereals-porridge",            code: "POR", attribute: "Weight",    variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "breakfast-cereals-instant-breakfast-mixes", code: "IBM", attribute: "Weight", variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "breakfast-cereals-honey-spreads",       code: "HNY", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "bakery-biscuits-cookies-biscuits",      code: "CKB", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "bakery-biscuits-cakes-pastries",        code: "CKP", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "bakery-biscuits-rusk-toast",            code: "RSK", attribute: "Weight",    variants: [{ value: "200g" }, { value: "400g" }] },
  { slug: "bakery-biscuits-muffins-donuts",        code: "MFN", attribute: "Pack Size", variants: [{ value: "4 Pcs" }, { value: "6 Pcs" }] },
  { slug: "bakery-biscuits-waffles-pancake-mix",   code: "WFL", attribute: "Weight",    variants: [{ value: "200g" }, { value: "400g" }] },
  { slug: "frozen-packaged-food-frozen-vegetables", code: "FZV", attribute: "Weight",   variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "frozen-packaged-food-frozen-snacks",    code: "FZS", attribute: "Weight",    variants: [{ value: "400g" }, { value: "750g" }] },
  { slug: "frozen-packaged-food-ready-to-eat-meals", code: "REM", attribute: "Weight",  variants: [{ value: "250g" }, { value: "400g" }] },
  { slug: "frozen-packaged-food-noodles-pasta",    code: "NDL", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "frozen-packaged-food-soups-broths",     code: "SPB", attribute: "Weight",    variants: [{ value: "50g" }, { value: "400g" }] },
  { slug: "frozen-packaged-food-frozen-desserts",  code: "FZD", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "chicken-meat-fish-fresh-chicken",       code: "FCK", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "chicken-meat-fish-mutton-lamb",         code: "MTN", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "chicken-meat-fish-fish-seafood",        code: "FSH", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "chicken-meat-fish-cold-cuts-sausages",  code: "CCS", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "chicken-meat-fish-marinated-ready-to-cook", code: "MRC", attribute: "Weight", variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-almonds",               code: "ALM", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-cashews",               code: "CSH", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-walnuts-pistachios",    code: "WNT", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-raisins-dates",         code: "RSD", attribute: "Weight",    variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-mixed-nuts",            code: "MXN", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "dry-fruits-nuts-seeds-trail-mix",       code: "SDT", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "sweets-chocolates-chocolates",          code: "CHC", attribute: "Weight",    variants: [{ value: "50g" }, { value: "200g" }] },
  { slug: "sweets-chocolates-indian-sweets-mithai", code: "ISW", attribute: "Weight",   variants: [{ value: "250g" }, { value: "500g" }] },
  { slug: "sweets-chocolates-candies-gummies",     code: "CDG", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "sweets-chocolates-ice-creams",          code: "ICE", attribute: "Volume",    variants: [{ value: "500mL" }, { value: "1L" }] },
  { slug: "sweets-chocolates-dessert-mixes",       code: "DSM", attribute: "Weight",    variants: [{ value: "100g" }, { value: "200g" }] },
  { slug: "sauces-spreads-more-ketchup-sauces",    code: "KTC", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "sauces-spreads-more-jams-jellies",      code: "JMJ", attribute: "Weight",    variants: [{ value: "200g" }, { value: "500g" }] },
  { slug: "sauces-spreads-more-pickles-chutneys",  code: "PCK", attribute: "Weight",    variants: [{ value: "200g" }, { value: "400g" }] },
  { slug: "sauces-spreads-more-peanut-butter",     code: "PNB", attribute: "Weight",    variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "sauces-spreads-more-dips-dressings",    code: "DPS", attribute: "Volume",    variants: [{ value: "250mL" }, { value: "500mL" }] },
  { slug: "baby-care-baby-food-formula",           code: "BFF", attribute: "Weight",    variants: [{ value: "400g" }, { value: "1kg" }] },
  { slug: "baby-care-diapers-wipes",               code: "DPW", attribute: "Pack Size", variants: [{ value: "20 Pcs" }, { value: "48 Pcs" }] },
  { slug: "baby-care-baby-skincare",               code: "BSK", attribute: "Volume",    variants: [{ value: "100mL" }, { value: "200mL" }] },
  { slug: "baby-care-baby-accessories",            code: "BAC", attribute: "Pack Size", variants: [{ value: "1 Pc" }, { value: "2 Pcs" }] },
  { slug: "baby-care-feeding-essentials",          code: "FDE", attribute: "Pack Size", variants: [{ value: "1 Pc" }, { value: "2 Pcs" }] },
  { slug: "health-wellness-vitamins-supplements",  code: "VTS", attribute: "Pack Size", variants: [{ value: "30 Pcs" }, { value: "60 Pcs" }] },
  { slug: "health-wellness-otc-medicines",         code: "OTC", attribute: "Pack Size", variants: [{ value: "10 Pcs" }, { value: "20 Pcs" }] },
  { slug: "health-wellness-protein-fitness",       code: "PTF", attribute: "Weight",    variants: [{ value: "1kg" }, { value: "2kg" }] },
  { slug: "health-wellness-ayurvedic-herbal",      code: "AYH", attribute: "Weight",    variants: [{ value: "100g" }, { value: "250g" }] },
  { slug: "health-wellness-first-aid",             code: "FAD", attribute: "Pack Size", variants: [{ value: "1 Pc" }, { value: "2 Pcs" }] },
  { slug: "home-cleaning-detergents-fabric-care",  code: "DFB", attribute: "Weight",    variants: [{ value: "1kg" }, { value: "3kg" }] },
  { slug: "home-cleaning-dishwash",                code: "DSH", attribute: "Weight",    variants: [{ value: "500g" }, { value: "1kg" }] },
  { slug: "home-cleaning-floor-toilet-cleaners",   code: "FLC", attribute: "Volume",    variants: [{ value: "500mL" }, { value: "1L" }] },
  { slug: "home-cleaning-fresheners-repellents",   code: "FRP", attribute: "Volume",    variants: [{ value: "250mL" }, { value: "500mL" }] },
  { slug: "home-cleaning-garbage-bags-foils",      code: "GBF", attribute: "Pack Size", variants: [{ value: "30 Pcs" }, { value: "48 Pcs" }] },
  { slug: "personal-care-beauty-skincare",         code: "SCR", attribute: "Volume",    variants: [{ value: "50mL" }, { value: "100mL" }] },
  { slug: "personal-care-beauty-haircare",         code: "HRC", attribute: "Volume",    variants: [{ value: "200mL" }, { value: "400mL" }] },
  { slug: "personal-care-beauty-bath-body",        code: "BTB", attribute: "Volume",    variants: [{ value: "200mL" }, { value: "500mL" }] },
  { slug: "personal-care-beauty-oral-care",        code: "ORC", attribute: "Weight",    variants: [{ value: "75g" }, { value: "150g" }] },
  { slug: "personal-care-beauty-feminine-hygiene", code: "FMH", attribute: "Pack Size", variants: [{ value: "8 Pcs" }, { value: "20 Pcs" }] },
  { slug: "personal-care-beauty-mens-grooming",    code: "MGR", attribute: "Volume",    variants: [{ value: "100mL" }, { value: "200mL" }] },
];

async function run() {
  await sequelize.authenticate();

  const [stores] = await sequelize.query(
    "SELECT id FROM stores ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];
  const storeId = stores[0]?.id;
  if (!storeId) { console.error("No store found."); process.exit(1); }

  // Load all attribute values keyed by "{attrName}:{value}"
  const [attrVals] = await sequelize.query(`
    SELECT va.name AS attr_name, vav.id, vav.value
    FROM variant_attribute_values vav
    JOIN variant_attributes va ON va.id = vav.attribute_id
    WHERE va.store_id = ? AND va.is_deleted = 0
  `, { replacements: [storeId] }) as [Array<{ attr_name: string; id: number; value: string }>, unknown];

  const valMap = new Map<string, number>();
  for (const r of attrVals) {
    valMap.set(`${r.attr_name}:${r.value}`, r.id);
  }

  let fixed = 0, alreadyOk = 0, missing = 0;

  for (const cat of DATA) {
    for (let pIdx = 1; pIdx <= 3; pIdx++) {
      const productCode = `GR${cat.code}${String(pIdx).padStart(2, "0")}`;

      for (let vIdx = 0; vIdx < cat.variants.length; vIdx++) {
        const sku = `${productCode}-V${vIdx + 1}`;
        const expectedValue = cat.variants[vIdx]!.value;
        const expectedAttrValId = valMap.get(`${cat.attribute}:${expectedValue}`);

        if (!expectedAttrValId) {
          console.log(`  [SKIP] No attribute value found for ${cat.attribute}:${expectedValue} (sku=${sku})`);
          missing++;
          continue;
        }

        // Find this variant in the DB
        const [varRows] = await sequelize.query(
          "SELECT id FROM product_variants WHERE sku=? LIMIT 1",
          { replacements: [sku] }
        ) as [Array<{ id: number }>, unknown];

        if (!varRows.length) continue; // Not seeded yet

        const variantId = varRows[0]!.id;

        // Get all current options for this variant
        const [opts] = await sequelize.query(
          "SELECT id, attribute_value_id FROM product_variant_options WHERE variant_id=?",
          { replacements: [variantId] }
        ) as [Array<{ id: number; attribute_value_id: number }>, unknown];

        if (opts.length === 0) {
          // No option at all — insert the correct one
          await sequelize.query(
            "INSERT INTO product_variant_options (variant_id, attribute_value_id) VALUES (?,?)",
            { replacements: [variantId, expectedAttrValId] }
          );
          console.log(`  [INSERT] ${sku} → ${cat.attribute}:${expectedValue} (attr_val_id=${expectedAttrValId})`);
          fixed++;
          continue;
        }

        const hasCorrect = opts.some(o => o.attribute_value_id === expectedAttrValId);
        const wrongOpts  = opts.filter(o => o.attribute_value_id !== expectedAttrValId);

        if (wrongOpts.length === 0) {
          alreadyOk++;
          continue;
        }

        // Remove all wrong option rows
        const wrongIds = wrongOpts.map(o => o.id);
        await sequelize.query(
          `DELETE FROM product_variant_options WHERE id IN (${wrongIds.map(() => "?").join(",")})`,
          { replacements: wrongIds }
        );

        // Ensure the correct one is present
        if (!hasCorrect) {
          await sequelize.query(
            "INSERT INTO product_variant_options (variant_id, attribute_value_id) VALUES (?,?)",
            { replacements: [variantId, expectedAttrValId] }
          );
        }

        console.log(`  [FIX] ${sku} — removed ${wrongIds.length} wrong option(s), kept ${cat.attribute}:${expectedValue}`);
        fixed++;
      }
    }
  }

  console.log(`\nDone — ${fixed} variants fixed, ${alreadyOk} already correct, ${missing} skipped (missing attr value).`);
  await sequelize.close();
}

run().catch(err => { console.error("Fix failed:", err.message); process.exit(1); });
