import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/nearby",             controller.nearby);
router.get("/delivery-estimate",  controller.deliveryEstimate);

export default router;
