import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/homepage",            controller.getHomepageLayout);
router.get("/app/homepage",        controller.getAppHomepageLayout);
router.get("/app/payment-screen",  controller.getAppPaymentScreen);
router.get("/app/header",          controller.getAppHeader);
router.get("/app/footer",          controller.getAppFooter);
router.get("/app/product-detail",  controller.getAppProductDetail);
router.get("/category",         controller.getCategoryLayout);
router.get("/product-listing",  controller.getProductListingLayout);
router.get("/product-detail",   controller.getProductDetailLayout);
router.get("/login-page",        controller.getLoginPageLayout);
router.get("/account-page",      controller.getAccountPageLayout);
router.get("/cart-page",         controller.getCartPageLayout);

export default router;
