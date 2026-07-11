import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/google", controller.googleLogin);
router.post("/facebook", controller.facebookLogin);
router.post("/apple", controller.appleLogin);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.get("/me",   clientMiddleware, controller.me);
router.patch("/me",              clientMiddleware, controller.updateMe);
router.post("/change-password",  clientMiddleware, controller.changePassword);

export default router;
