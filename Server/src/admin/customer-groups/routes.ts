import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/all", checkPermission("/customer-groups"), controller.getAll);
router.get("/", checkPermission("/customer-groups"), controller.list);
router.post("/", checkPermission("/customer-groups"), controller.create);
router.put("/:id", checkPermission("/customer-groups"), controller.update);
router.delete("/:id", checkPermission("/customer-groups"), controller.remove);

export default router;
