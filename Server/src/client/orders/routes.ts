import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.use(clientMiddleware);

router.get("/", controller.getOrders);
router.post("/", controller.createOrder);
router.get("/:id", controller.getOrderById);

export default router;
