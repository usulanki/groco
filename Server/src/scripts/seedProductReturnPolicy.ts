import sequelize from "../config/database";
import Config from "../models/config.model";
import ConfigItem from "../models/configItem.model";

const RETURN_POLICY_ITEMS = [
  "No Return",
  "7 Days Return",
  "14 Days Return",
  "30 Days Return",
];

async function run() {
  await sequelize.authenticate();
  await Config.sync();
  await ConfigItem.sync();

  const [config, configCreated] = await Config.findOrCreate({
    where: { code: "PRODUCT_RETURN_POLICY" },
    defaults: { code: "PRODUCT_RETURN_POLICY", store_id: null },
  });
  console.log(`Config PRODUCT_RETURN_POLICY: ${configCreated ? "created" : "already exists"} (id=${config.id})`);

  for (const value of RETURN_POLICY_ITEMS) {
    const [ci, created] = await ConfigItem.findOrCreate({
      where: { config_id: config.id, value, store_id: null },
      defaults: { config_id: config.id, value, store_id: null, status: 1, is_deleted: 0 },
    });
    console.log(`  ConfigItem "${value}": ${created ? "created" : "already exists"} (id=${ci.id})`);
  }

  console.log("\nDone.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
