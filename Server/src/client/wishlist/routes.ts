import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.use(clientMiddleware);

router.get("/", controller.getWishlist);
router.post("/", controller.addToWishlist);
router.delete("/:productId", controller.removeFromWishlist);

export default router;
