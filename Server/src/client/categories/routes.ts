import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/", controller.getCategories);
router.get("/:slug", controller.getCategoryBySlug);

export default router;
