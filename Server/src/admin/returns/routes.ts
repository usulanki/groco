import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",                        checkPermission("/returns"),          controller.list);
router.get("/purchase/grn/:code",      checkPermission("/returns/purchase"), controller.getGrnForReturn);
router.post("/purchase",               checkPermission("/returns/purchase"), controller.createPurchaseReturn);
router.get("/:id",                     checkPermission("/returns"),          controller.getOne);

export default router;
