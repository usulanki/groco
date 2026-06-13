import { Router } from "express";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";
import * as controller from "./controller";

const router = Router();

router.get("/",       checkPermission("/customers"), controller.getAllUsers);
router.post("/",      checkPermission("/customers"), controller.createUser);
router.get("/:id",              checkPermission("/customers"), controller.getUserById);
router.get("/:id/wishlist",     checkPermission("/customers"), controller.getUserWishlist);
router.get("/:id/orders",       checkPermission("/customers"), controller.getUserOrders);
router.get("/:id/addresses",    checkPermission("/customers"), controller.getUserAddresses);
router.post("/:id/addresses",   checkPermission("/customers"), controller.createUserAddress);
router.get("/:id/cart",         checkPermission("/customers"), controller.getUserCart);
router.get("/:id/payments",     checkPermission("/customers"), controller.getUserPayments);
router.get("/:id/discounts",    checkPermission("/customers"), controller.getUserDiscountUsages);
router.delete("/:id",           checkPermission("/customers"), controller.deleteUser);
router.patch("/:id/restore", checkPermission("/customers"), controller.restore);

export default router;
