import { Router } from "express";
import * as controller from "./controller";

const router = Router();

// No checkPermission — no DB permission rows exist for the hidden /permissions menu.
// The adminMiddleware (applied globally) already ensures authentication.
router.get("/", controller.getByRole);
router.put("/bulk", controller.bulkUpdate);
router.put("/:id", controller.update);

export default router;
