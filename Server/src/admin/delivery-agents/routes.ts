import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/",              controller.list);
router.post("/",             controller.create);
router.put("/:id",           controller.update);
router.delete("/:id",        controller.remove);
router.patch("/:id/status",  controller.toggleStatus);

export default router;
