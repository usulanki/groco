import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/",           controller.listStores);
router.get("/detailed",   controller.listDetailed);
router.post("/",          controller.createStore);
router.put("/:id",        controller.updateStore);
router.delete("/:id",     controller.deleteStore);
router.patch("/:id/status", controller.toggleStoreStatus);
router.get("/:id",        controller.getStore);

export default router;
