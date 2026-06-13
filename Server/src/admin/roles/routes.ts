import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

// Roles has no DB permission rows (it's a hidden system menu), so access
// control is handled inside the service via buildCallerScope.
router.get("/all", controller.getAll);
router.get("/", controller.list);
router.post("/", checkPermission("/admins"), controller.create);
router.put("/:id", checkPermission("/admins"), controller.update);
router.delete("/:id", checkPermission("/admins"), controller.remove);
router.patch("/:id/status", checkPermission("/admins"), controller.changeStatus);
router.patch("/:id/restore", checkPermission("/admins"), controller.restore);

export default router;
