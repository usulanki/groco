import { Router } from "express";
import * as controller from "./controller";

const router = Router();

// Authenticated admins only — no extra permission check needed (settings is admin-only)
router.get("/", controller.getTrash);

export default router;
