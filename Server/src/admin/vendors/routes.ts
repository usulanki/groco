import { Router } from "express";
import multer from "multer";
import * as controller from "./controller";
import { importVendors } from "./importController";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/import", checkPermission("/vendors"), upload.single("file"), importVendors);
router.get("/",        checkPermission("/vendors"), controller.list);
router.get("/:id",     checkPermission("/vendors"), controller.getById);
router.post("/",       checkPermission("/vendors"), controller.create);
router.put("/:id",     checkPermission("/vendors"), controller.update);
router.patch("/:id/status", checkPermission("/vendors"), controller.toggleStatus);
router.delete("/:id",  checkPermission("/vendors"), controller.remove);
router.patch("/:id/restore", checkPermission("/vendors"), controller.restore);

export default router;
