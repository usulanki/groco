import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/",  controller.getSettings);
router.put("/",  controller.updateSettings);

export default router;
