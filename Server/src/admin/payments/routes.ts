import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/",                    checkPermission("/payments"),        controller.list);
router.get("/vendor-credit-notes", checkPermission("/payments/vendor"), controller.vendorCreditNotes);
router.get("/vendor-data",         checkPermission("/payments/vendor"), controller.vendorData);
router.post("/vendor",             checkPermission("/payments/vendor"), controller.createVendor);

export default router;
