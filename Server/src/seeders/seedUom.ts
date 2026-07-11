import sequelize from "../config/database";
import "../models/index";
import Uom from "../models/uom.model";

const UOM_DATA = [
  // ── Weight ──────────────────────────────────────────────────────────────
  { name: "Kilogram",          short_name: "kg"    },
  { name: "Gram",              short_name: "g"     },
  { name: "Milligram",         short_name: "mg"    },
  { name: "Pound",             short_name: "lb"    },
  { name: "Ounce",             short_name: "oz"    },
  { name: "Metric Ton",        short_name: "MT"    },
  { name: "Quintal",           short_name: "qtl"   },

  // ── Volume ───────────────────────────────────────────────────────────────
  { name: "Liter",             short_name: "L"     },
  { name: "Milliliter",        short_name: "mL"    },
  { name: "Fluid Ounce",       short_name: "fl oz" },
  { name: "Gallon",            short_name: "gal"   },
  { name: "Pint",              short_name: "pt"    },
  { name: "Quart",             short_name: "qt"    },

  // ── Count / Packaging ────────────────────────────────────────────────────
  { name: "Piece",             short_name: "Pcs"   },
  { name: "Dozen",             short_name: "Doz"   },
  { name: "Pack",              short_name: "Pk"    },
  { name: "Box",               short_name: "Box"   },
  { name: "Carton",            short_name: "Ctn"   },
  { name: "Bundle",            short_name: "Bdl"   },
  { name: "Bag",               short_name: "Bag"   },
  { name: "Bottle",            short_name: "Btl"   },
  { name: "Can",               short_name: "Can"   },
  { name: "Jar",               short_name: "Jar"   },
  { name: "Sachet",            short_name: "Scht"  },
  { name: "Strip",             short_name: "Strp"  },
  { name: "Tray",              short_name: "Tray"  },
  { name: "Roll",              short_name: "Roll"  },
  { name: "Tube",              short_name: "Tube"  },

  // ── Length ───────────────────────────────────────────────────────────────
  { name: "Meter",             short_name: "m"     },
  { name: "Centimeter",        short_name: "cm"    },
];

async function seedUom() {
  await sequelize.authenticate();

  const [stores] = await sequelize.query(
    "SELECT id FROM stores ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];

  const storeId = stores[0]?.id;
  if (!storeId) {
    console.error("No store found in database. Run the main seed first.");
    process.exit(1);
  }
  console.log(`Using store id=${storeId}`);

  const [admins] = await sequelize.query(
    "SELECT id FROM admins WHERE role_id = (SELECT id FROM roles WHERE code = 'SUPERADMIN') LIMIT 1"
  ) as [Array<{ id: number }>, unknown];
  const createdBy = admins[0]?.id ?? null;

  let created = 0;
  let skipped = 0;

  for (const uom of UOM_DATA) {
    const [, wasCreated] = await Uom.findOrCreate({
      where: { store_id: storeId, name: uom.name },
      defaults: {
        store_id:   storeId,
        name:       uom.name,
        short_name: uom.short_name,
        status:     true,
        is_deleted: false,
        created_by: createdBy,
      },
    });
    if (wasCreated) {
      console.log(`  ✓ Created  ${uom.name.padEnd(20)} (${uom.short_name})`);
      created++;
    } else {
      console.log(`  – Skipped  ${uom.name.padEnd(20)} (already exists)`);
      skipped++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed.`);
  await sequelize.close();
}

seedUom().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
