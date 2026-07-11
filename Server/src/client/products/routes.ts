import { Router } from "express";
import * as controller from "./controller";
import { outletMiddleware } from "../../shared/middleware/outletMiddleware";

const router = Router();

router.get("/", outletMiddleware, controller.getProducts);
router.get("/:id", controller.getProductById);

export default router;
