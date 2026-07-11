import express from "express";
import cors from "cors";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import { adminMiddleware } from "./shared/middleware/adminMiddleware";

// Admin routes
import adminAuthRouter from "./admin/auth/routes";
import adminAdminsRouter from "./admin/admins/routes";
import adminUsersRouter from "./admin/users/routes";
import adminProductsRouter from "./admin/products/routes";
import adminCategoriesRouter from "./admin/categories/routes";
import adminOrdersRouter from "./admin/orders/routes";
import adminRolesRouter from "./admin/roles/routes";
import adminPermissionsRouter from "./admin/permissions/routes";
import adminTaxRouter from "./admin/tax/routes";
import adminMediaRouter from "./admin/media/routes";
import adminUomRouter from "./admin/uom/routes";
import adminBrandsRouter from "./admin/brands/routes";
import adminCustomerGroupsRouter from "./admin/customer-groups/routes";
import adminVariantAttributesRouter from "./admin/variant-attributes/routes";
import adminDiscountsRouter from "./admin/discounts/routes";
import adminOutletsRouter from "./admin/outlets/routes";
import adminStoresRouter from "./admin/stores/routes";
import adminVendorsRouter from "./admin/vendors/routes";
import adminMaterialsRouter from "./admin/materials/routes";
import adminPurchasesRouter from "./admin/purchases/routes";
import adminGrnRouter from "./admin/grn/routes";
import adminInventoryRouter from "./admin/inventory/routes";
import adminReturnsRouter from "./admin/returns/routes";
import adminCreditNotesRouter from "./admin/credit-notes/routes";
import adminTransactionsRouter from "./admin/transactions/routes";
import adminPaymentsRouter from "./admin/payments/routes";
import adminConfigsRouter from "./admin/configs/routes";
import adminTrashRouter from "./admin/trash/routes";
import adminNotificationSettingsRouter from "./admin/notification-settings/routes";
import adminBackgroundJobsRouter from "./admin/background-jobs/routes";
import adminSettingMenusRouter from "./admin/setting-menus/routes";
import adminLocationsRouter from "./admin/locations/routes";
import adminDeliveryPartnersRouter from "./admin/delivery-partners/routes";
import adminDeliveryAgentsRouter from "./admin/delivery-agents/routes";
import adminCmsRouter from "./admin/cms/routes";
import adminOverviewRouter from "./admin/overview/routes";
// Client routes
import authRouter from "./client/auth/routes";
import clientUsersRouter from "./client/users/routes";
import clientProductsRouter from "./client/products/routes";
import clientCategoriesRouter from "./client/categories/routes";
import cartRouter from "./client/cart/routes";
import clientOrdersRouter from "./client/orders/routes";
import paymentsRouter from "./client/payments/routes";
import reviewsRouter from "./client/reviews/routes";
import wishlistRouter from "./client/wishlist/routes";
import addressRouter from "./client/address/routes";
import locationsRouter from "./client/locations/routes";
import clientOutletsRouter from "./client/outlets/routes";
import clientCmsRouter from "./client/cms/routes";
// Delivery routes
import deliveryAuthRouter    from "./delivery/auth/routes";
import deliveryOrdersRouter  from "./delivery/orders/routes";
import deliveryOutletsRouter from "./delivery/outlets/routes";
import deliveryWalletRouter  from "./delivery/wallet/routes";

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
];
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

// Admin API
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin", adminMiddleware);
app.use("/api/admin/admins", adminAdminsRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/roles", adminRolesRouter);
app.use("/api/admin/permissions", adminPermissionsRouter);
app.use("/api/admin/tax", adminTaxRouter);
app.use("/api/admin/media", adminMediaRouter);
app.use("/api/admin/uom", adminUomRouter);
app.use("/api/admin/brands", adminBrandsRouter);
app.use("/api/admin/customer-groups", adminCustomerGroupsRouter);
app.use("/api/admin/variant-attributes", adminVariantAttributesRouter);
app.use("/api/admin/discounts", adminDiscountsRouter);
app.use("/api/admin/outlets", adminOutletsRouter);
app.use("/api/admin/stores", adminStoresRouter);
app.use("/api/admin/vendors", adminVendorsRouter);
app.use("/api/admin/materials", adminMaterialsRouter);
app.use("/api/admin/purchases", adminPurchasesRouter);
app.use("/api/admin/grns", adminGrnRouter);
app.use("/api/admin/inventory", adminInventoryRouter);
app.use("/api/admin/returns", adminReturnsRouter);
app.use("/api/admin/credit-notes", adminCreditNotesRouter);
app.use("/api/admin/transactions", adminTransactionsRouter);
app.use("/api/admin/payments", adminPaymentsRouter);
app.use("/api/admin/configs", adminConfigsRouter);
app.use("/api/admin/trash", adminTrashRouter);
app.use("/api/admin/notification-settings", adminNotificationSettingsRouter);
app.use("/api/admin/background-jobs", adminBackgroundJobsRouter);
app.use("/api/admin/setting-menus", adminSettingMenusRouter);
app.use("/api/admin/locations", adminLocationsRouter);
app.use("/api/admin/delivery-partners", adminDeliveryPartnersRouter);
app.use("/api/admin/delivery-agents", adminDeliveryAgentsRouter);
app.use("/api/admin", adminCmsRouter);
app.use("/api/admin/overview", adminOverviewRouter);
// Client API
app.use("/api/auth", authRouter);
app.use("/api/users", clientUsersRouter);
app.use("/api/products", clientProductsRouter);
app.use("/api/categories", clientCategoriesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", clientOrdersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/outlets", clientOutletsRouter);
app.use("/api/cms", clientCmsRouter);
// Delivery API
app.use("/api/delivery/auth",    deliveryAuthRouter);
app.use("/api/delivery/orders",  deliveryOrdersRouter);
app.use("/api/delivery/outlets", deliveryOutletsRouter);
app.use("/api/delivery/wallet",  deliveryWalletRouter);
app.use(errorMiddleware);

export default app;
