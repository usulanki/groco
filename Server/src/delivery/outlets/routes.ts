import { Router } from "express";
import { deliveryMiddleware } from "../../shared/middleware/deliveryMiddleware";
import * as controller from "./controller";

const router = Router();

router.get("/nearby", deliveryMiddleware, controller.nearby);

export default router;
