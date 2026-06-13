import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.use(clientMiddleware);

router.post("/create-intent",    controller.createIntent);
router.post("/confirm",          controller.confirmPayment);
router.post("/razorpay-create",  controller.createRazorpayOrder);
router.post("/razorpay-verify",  controller.verifyRazorpayPayment);

export default router;
