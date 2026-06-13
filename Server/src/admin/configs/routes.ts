import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.get("/code/:code/items", controller.getItemsByCode);

export default router;
