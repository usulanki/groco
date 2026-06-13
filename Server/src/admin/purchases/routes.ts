import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",      checkPermission("/purchases"), controller.list);
router.get("/:id",   checkPermission("/purchases"), controller.getOne);
router.post("/",     checkPermission("/purchases"), controller.create);
router.put("/:id",      checkPermission("/purchases"), controller.update);
router.post("/:id/grn", checkPermission("/purchases"), controller.grn);

export default router;
