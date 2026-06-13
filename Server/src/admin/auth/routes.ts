import { Router } from "express";
import * as controller from "./controller";
import { adminMiddleware } from "../../shared/middleware/adminMiddleware";

const router = Router();

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", adminMiddleware, controller.logout);

export default router;
