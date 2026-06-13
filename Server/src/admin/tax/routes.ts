import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/all", checkPermission("/tax"), controller.getAll);
router.get("/", checkPermission("/tax"), controller.list);
router.post("/", checkPermission("/tax"), controller.create);
router.put("/:id", checkPermission("/tax"), controller.update);
router.delete("/:id", checkPermission("/tax"), controller.remove);
router.patch("/:id/restore", checkPermission("/tax"), controller.restore);

export default router;
