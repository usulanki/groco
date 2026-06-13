/**
 * Renames the "Transactions" sidebar menu to "Payments" and points it at /payments.
 * Also hides the sub-menus (Vendor Payments / Customer Payments) from the sidebar
 * so the parent appears as a direct link with no dropdown.
 *
 * Safe to re-run — all updates are idempotent.
 *
 * Run: npx ts-node src/seeders/renameTransactionsToPayments.ts
 */
import sequelize from "../config/database";
import "../models/index";
import Menu from "../models/menu.model";

async function run() {
  await sequelize.authenticate();
  console.log("DB connected.");

  // 1 – Find the Transactions parent menu
  const transactionsMenu = await Menu.findOne({
    where: { name: "Transactions", parent_id: null },
  });

  if (!transactionsMenu) {
    console.error('Menu "Transactions" not found. Nothing to do.');
    await sequelize.close();
    return;
  }

  // 2 – Rename parent: Transactions → Payments, link /transactions → /payments
  await transactionsMenu.update({
    name:  "Payments",
    link:  "/payments",
    icon:  "payments",
  });
  console.log(`Menu id=${transactionsMenu.id} renamed to "Payments" with link="/payments".`);

  // 3 – Hide children from sidebar (they are now tabs inside the page, not nav items)
  const [affected] = await Menu.update(
    { show_in_sidebar: false },
    { where: { parent_id: transactionsMenu.id } }
  );
  console.log(`${affected} child menu(s) hidden from sidebar.`);

  await sequelize.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
