import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",        checkPermission("/brands"), controller.list);
router.post("/",       checkPermission("/brands"), controller.create);
router.put("/:id",     checkPermission("/brands"), controller.update);
router.delete("/:id",  checkPermission("/brands"), controller.remove);
router.patch("/:id/status", checkPermission("/brands"), controller.toggleStatus);

export default router;
