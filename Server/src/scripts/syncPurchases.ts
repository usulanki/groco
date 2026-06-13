import sequelize from "../config/database";
import "../models/index";
import Invoice from "../models/invoice.model";
import Purchase from "../models/purchase.model";
import PurchaseItem from "../models/purchaseItem.model";

(async () => {
  await sequelize.authenticate();
  console.log("Connected.");
  await Invoice.sync({ alter: true });
  console.log("invoices table synced.");
  await Purchase.sync({ alter: true });
  console.log("purchases table synced.");
  await PurchaseItem.sync({ alter: true });
  console.log("purchase_items table synced.");
  await sequelize.close();
})();
