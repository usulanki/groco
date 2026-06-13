import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/:productId", controller.getProductReviews);
router.post("/", controller.createReview);

export default router;
