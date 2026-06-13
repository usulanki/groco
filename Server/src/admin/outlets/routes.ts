import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",             checkPermission("/products"), controller.list);
router.get("/:id",          controller.getById);
router.post("/",            controller.create);
router.put("/:id",          controller.update);
router.delete("/:id",       controller.remove);
router.patch("/:id/status", controller.toggleStatus);

export default router;
