import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/homepage",         controller.getHomepageLayout);
router.get("/category",         controller.getCategoryLayout);
router.get("/product-listing",  controller.getProductListingLayout);
router.get("/product-detail",   controller.getProductDetailLayout);
router.get("/login-page",        controller.getLoginPageLayout);
router.get("/account-page",      controller.getAccountPageLayout);
router.get("/cart-page",         controller.getCartPageLayout);

export default router;
