import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",             checkPermission("/products"), controller.list);
router.get("/:id",          controller.getById);
router.post("/",            controller.create);
router.put("/:id",          controller.update);
router.delete("/:id",       controller.remove);
router.patch("/:id/status",               controller.toggleStatus);
router.patch("/:id/delivery",             controller.updateDelivery);
router.patch("/:id/serviceable-distance", controller.updateServiceableDistance);
router.patch("/:id/delivery-charge",      controller.updateDeliveryCharge);

export default router;
