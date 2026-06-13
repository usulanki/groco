import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

// Profile routes (no permission guard — self-access only)
router.get("/me", controller.getMe);
router.patch("/me", controller.updateMe);
router.patch("/me/password", controller.changePassword);

router.get("/all", checkPermission("/admins"), controller.getAll);
router.get("/", checkPermission("/admins"), controller.list);
router.post("/", checkPermission("/admins"), controller.create);
router.put("/:id", checkPermission("/admins"), controller.update);
router.patch("/:id/status", checkPermission("/admins"), controller.changeStatus);
router.delete("/:id", checkPermission("/admins"), controller.remove);
router.patch("/:id/restore", checkPermission("/admins"), controller.restore);

export default router;
