import { Router } from "express";
import * as controller from "./controller";
import { checkPermission } from "../../shared/middleware/permissionMiddleware";

const router = Router();

router.get("/", checkPermission("/products"), controller.list);
router.get("/:id", checkPermission("/products"), controller.getById);
router.post("/", checkPermission("/products"), controller.create);
router.put("/:id", checkPermission("/products"), controller.update);
router.delete("/:id", checkPermission("/products"), controller.remove);
router.patch("/:id/status", checkPermission("/products"), controller.changeStatus);
router.patch("/:id/restore", checkPermission("/products"), controller.restore);

// Variants sub-resource
router.get("/:id/variants", checkPermission("/products"), controller.listVariants);
router.post("/:id/variants", checkPermission("/products"), controller.createVariant);
router.put("/:id/variants/:variantId", checkPermission("/products"), controller.updateVariant);
router.delete("/:id/variants/:variantId", checkPermission("/products"), controller.deleteVariant);

// Media sub-resource
router.get("/:id/media", checkPermission("/products"), controller.getMedia);
router.post("/:id/media", checkPermission("/products"), controller.addMedia);
router.get("/:id/variants/:variantId/media", checkPermission("/products"), controller.getVariantMedia);
router.patch("/:id/media/:mediaId/primary", checkPermission("/products"), controller.setPrimaryMedia);
router.patch("/:id/media/reorder", checkPermission("/products"), controller.reorderMedia);
router.delete("/:id/media/:mediaId", checkPermission("/products"), controller.removeMedia);

// Pricing sub-resource
router.get("/:id/prices", checkPermission("/products"), controller.listPrices);
router.post("/:id/prices", checkPermission("/products"), controller.createPrice);
router.put("/:id/prices/:priceId", checkPermission("/products"), controller.updatePrice);
router.delete("/:id/prices/:priceId", checkPermission("/products"), controller.deletePrice);

// Return policy sub-resource
router.get("/:id/return-policy", checkPermission("/products"), controller.getReturnPolicy);
router.post("/:id/return-policy", checkPermission("/products"), controller.saveReturnPolicy);

// Inventory sub-resource
router.get("/:id/inventory", checkPermission("/products"), controller.listInventory);
router.post("/:id/inventory", checkPermission("/products"), controller.createInventory);
router.put("/:id/inventory/:invId", checkPermission("/products"), controller.updateInventory);
router.delete("/:id/inventory/:invId", checkPermission("/products"), controller.deleteInventory);

export default router;
