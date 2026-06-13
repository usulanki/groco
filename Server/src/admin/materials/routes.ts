import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",        checkPermission("/materials"), controller.list);
router.post("/",       checkPermission("/materials"), controller.create);
router.put("/:id",     checkPermission("/materials"), controller.update);
router.patch("/:id/status", checkPermission("/materials"), controller.toggleStatus);
router.delete("/:id",  checkPermission("/materials"), controller.remove);
router.patch("/:id/restore", checkPermission("/materials"), controller.restore);

export default router;
