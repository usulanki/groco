import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/all",   checkPermission("/categories"), controller.getAll);
router.get("/",      checkPermission("/categories"), controller.list);
router.get("/:id",   checkPermission("/categories"), controller.getById);
router.post("/",     checkPermission("/categories"), controller.create);
router.put("/:id",   checkPermission("/categories"), controller.update);
router.delete("/:id",checkPermission("/categories"), controller.remove);
router.patch("/:id/status", checkPermission("/categories"), controller.changeStatus);
router.patch("/:id/restore", checkPermission("/categories"), controller.restore);

export default router;
