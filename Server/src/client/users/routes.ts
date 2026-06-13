import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/me", controller.getProfile);
router.put("/me", controller.updateProfile);

export default router;
