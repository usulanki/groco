import { Router } from "express";
import { deliveryMiddleware } from "../../shared/middleware/deliveryMiddleware";
import * as controller from "./controller";

const router = Router();

router.get("/summary",        deliveryMiddleware, controller.summary);
router.get("/payouts",        deliveryMiddleware, controller.payouts);
router.post("/payout",        deliveryMiddleware, controller.requestPayout);

export default router;
