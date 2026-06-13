import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",    checkPermission("/orders"), controller.list);
router.get("/:id", checkPermission("/orders"), controller.getById);
router.post("/",   checkPermission("/orders"), controller.create);
router.delete("/:id",        checkPermission("/orders"), controller.remove);
router.patch("/:id/status",   checkPermission("/orders"), controller.changeStatus);
router.patch("/:id/outlet",   checkPermission("/orders"), controller.transferOutlet);
router.get("/:id/history",   checkPermission("/orders"), controller.getHistory);

export default router;
