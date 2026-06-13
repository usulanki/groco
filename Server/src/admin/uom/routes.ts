import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/all", checkPermission("/uom"), controller.getAll);
router.get("/", checkPermission("/uom"), controller.list);
router.post("/", checkPermission("/uom"), controller.create);
router.put("/:id", checkPermission("/uom"), controller.update);
router.delete("/:id", checkPermission("/uom"), controller.remove);
router.patch("/:id/restore", checkPermission("/uom"), controller.restore);

export default router;
