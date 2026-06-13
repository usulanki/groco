import { Router } from "express";
import * as controller from "./controller";
import { clientMiddleware } from "../../shared/middleware/clientMiddleware";

const router = Router();

router.use(clientMiddleware);

router.get("/", controller.getAddresses);
router.post("/", controller.createAddress);
router.delete("/:id", controller.deleteAddress);

export default router;
