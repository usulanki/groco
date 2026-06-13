import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",         checkPermission("/inventory"),              controller.list);
router.get("/download", checkPermission("/inventory", "download"),  controller.download);

export default router;
