import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.post("/upload", controller.upload);
router.get("/", controller.list);

export default router;
