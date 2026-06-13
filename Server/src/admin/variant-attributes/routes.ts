import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/all", checkPermission("/variants"), controller.getAll);
router.get("/", checkPermission("/variants"), controller.list);
router.post("/", checkPermission("/variants"), controller.create);
router.put("/:id", checkPermission("/variants"), controller.update);
router.delete("/:id", checkPermission("/variants"), controller.remove);

// Values sub-resource
router.post("/:id/values", checkPermission("/variants"), controller.addValue);
router.put("/:id/values/:valueId", checkPermission("/variants"), controller.updateValue);
router.delete("/:id/values/:valueId", checkPermission("/variants"), controller.removeValue);

export default router;
