/**
 * bootstrap.ts — Run this once on a fresh database.
 * It syncs all tables, creates the SUPERADMIN role and the superadmin admin,
 * then delegates to the seed script for the rest of the data.
 */

import bcrypt from "bcryptjs";
import sequelize, { createSchemaIfNotExists } from "../config/database";
import "../models/index";
import Role from "../models/role.model";
import Admin from "../models/admin.model";

(async () => {
  try {
    // 1. Ensure schema exists and create all tables
    await createSchemaIfNotExists();
    await sequelize.authenticate();
    console.log("Connected to database.");

    await sequelize.query("SET FOREIGN_KEY_CHECKS=0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS=1");
    console.log("All tables created.");

    // 2. Create SUPERADMIN role first (no FK deps)
    const [superadminRole] = await Role.findOrCreate({
      where: { code: "SUPERADMIN" },
      defaults: { name: "Super Admin", code: "SUPERADMIN" },
    });
    console.log(`SUPERADMIN role: id=${superadminRole.id}`);

    // 3. Create the superadmin admin
    const passwordHash = await bcrypt.hash("Password@123", 10);
    const [superAdmin, created] = await Admin.findOrCreate({
      where: { username: "superadmin" },
      defaults: {
        fname: "Super",
        lname: "Admin",
        email: "superadmin@karto.com",
        username: "superadmin",
        password: passwordHash,
        role_id: superadminRole.id,
      },
    });
    console.log(`Superadmin: ${created ? "created" : "already exists"} (id=${superAdmin.id})`);

    await sequelize.close();
    console.log("\nBootstrap complete. Now run: npx tsx src/seeders/seed.ts");
  } catch (err) {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  }
})();
