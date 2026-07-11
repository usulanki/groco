import { Router } from "express";
import * as controller from "./controller";
import { outletMiddleware } from "../../shared/middleware/outletMiddleware";

const router = Router();

router.get("/", outletMiddleware, controller.getCategories);
router.get("/:slug", outletMiddleware, controller.getCategoryBySlug);

export default router;
