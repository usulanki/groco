import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/google", controller.googleLogin);
router.post("/facebook", controller.facebookLogin);
router.post("/apple", controller.appleLogin);

export default router;
