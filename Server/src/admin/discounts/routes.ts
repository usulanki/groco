import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",      checkPermission("/promotions/coupons"), controller.list);
router.get("/stats", checkPermission("/promotions/coupons"), controller.stats);
router.get("/:id",   checkPermission("/promotions/coupons"), controller.getById);
router.post("/",     checkPermission("/promotions/coupons"), controller.create);
router.put("/:id",   checkPermission("/promotions/coupons"), controller.update);
router.delete("/:id",checkPermission("/promotions/coupons"), controller.remove);

export default router;
