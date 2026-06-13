import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/", controller.getProducts);
router.get("/:id", controller.getProductById);

export default router;
