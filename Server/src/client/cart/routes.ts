import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.use(clientMiddleware);

router.get("/", controller.getCart);
router.post("/", controller.addToCart);
router.post("/apply-coupon", controller.applyCoupon);
router.patch("/:productId/decrement", controller.decrementFromCart);
router.delete("/:productId", controller.removeFromCart);

export default router;
