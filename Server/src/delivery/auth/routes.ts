import { Router } from "express";
import { deliveryMiddleware } from "../../shared/middleware/deliveryMiddleware";
import * as controller from "./controller";

const router = Router();

// Public
router.post("/login",          controller.login);
router.post("/refresh",        controller.refresh);
router.post("/forgot-password",controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// Protected
router.post("/logout",          deliveryMiddleware, controller.logout);
router.get("/me",               deliveryMiddleware, controller.me);
router.post("/change-password", deliveryMiddleware, controller.changePassword);

export default router;
