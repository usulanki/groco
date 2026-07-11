import { Router } from "express";
import { deliveryMiddleware } from "../../shared/middleware/deliveryMiddleware";
import * as controller from "./controller";

const router = Router();

router.get("/active",        deliveryMiddleware, controller.activeOrders);
router.get("/delivered",     deliveryMiddleware, controller.deliveredOrders);
router.post("/:id/accept",  deliveryMiddleware, controller.accept);
router.get("/:id/detail",   deliveryMiddleware, controller.detail);
router.post("/:id/deliver", deliveryMiddleware, controller.deliver);

export default router;
