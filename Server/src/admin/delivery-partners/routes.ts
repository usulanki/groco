import { Router } from "express";
import * as controller from "./controller";

const router = Router();

// Delivery partner list & status toggle
router.get("/",              controller.list);
router.patch("/:id/status",  controller.toggleStatus);

// Per-store feature flag (master enable/disable)
router.get("/feature-flag",  controller.getFlag);
router.patch("/feature-flag", controller.setFlag);

export default router;
