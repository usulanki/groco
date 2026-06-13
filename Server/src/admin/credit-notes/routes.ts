import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",                    checkPermission("/returns/purchase"), controller.list);
router.get("/by-return/:returnId", checkPermission("/returns/purchase"), controller.getByReturnId);
router.get("/:id",                 checkPermission("/returns/purchase"), controller.getOne);
router.post("/",                   checkPermission("/returns/purchase"), controller.create);

export default router;
