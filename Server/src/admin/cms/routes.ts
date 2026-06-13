import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/cms/homepage",  controller.getHomepageLayout);
router.post("/cms/homepage", controller.saveHomepageLayout);

router.get("/cms/category",  controller.getCategoryLayout);
router.post("/cms/category", controller.saveCategoryLayout);

router.get("/cms/product-listing",  controller.getProductListingLayout);
router.post("/cms/product-listing", controller.saveProductListingLayout);

router.get("/cms/product-detail",  controller.getProductDetailLayout);
router.post("/cms/product-detail", controller.saveProductDetailLayout);

router.get("/cms/login-page",  controller.getLoginPageLayout);
router.post("/cms/login-page", controller.saveLoginPageLayout);

router.get("/cms/cart",  controller.getCartPageLayout);
router.post("/cms/cart", controller.saveCartPageLayout);

router.get("/cms/account-page",  controller.getAccountPageLayout);
router.post("/cms/account-page", controller.saveAccountPageLayout);

router.get("/cms/checkout",  controller.getCheckoutPageLayout);
router.post("/cms/checkout", controller.saveCheckoutPageLayout);

router.get("/cms/payment",  controller.getPaymentPageLayout);
router.post("/cms/payment", controller.savePaymentPageLayout);

export default router;
