import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",    checkPermission("/grn"), controller.list);
router.get("/:id", checkPermission("/grn"), controller.getOne);

export default router;
