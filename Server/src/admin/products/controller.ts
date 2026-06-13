import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";
import * as variantService from "./variantService";
import * as mediaService from "./mediaService";
import * as pricingService from "./pricingService";
import * as inventoryService from "./inventoryService";
import * as returnPolicyService from "./returnPolicyService";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query["page"]  as string) || 1);
  const limit = Math.max(1, parseInt(req.query["limit"] as string) || 20);

  const rawStatus = req.query["status"] as string | undefined;
  const status = rawStatus === "active" || rawStatus === "inactive" || rawStatus === "draft"
    ? rawStatus : undefined;

  const rawSortBy = req.query["sort_by"] as string | undefined;
  const sort_by = rawSortBy === "name" || rawSortBy === "created_ts" ? rawSortBy : undefined;

  const rawSortDir = req.query["sort_dir"] as string | undefined;
  const sort_dir = rawSortDir === "asc" || rawSortDir === "desc" ? rawSortDir : undefined;

  const category_id  = req.query["category_id"]  ? Number(req.query["category_id"])  : undefined;
  const outlet_id    = req.query["outlet_id"]     ? Number(req.query["outlet_id"])     : undefined;
  const is_stockable = req.query["is_stockable"] === "true" ? true : req.query["is_stockable"] === "false" ? false : undefined;
  const low_stock    = req.query["low_stock"] === "true" ? true : undefined;
  const search       = req.query["search"] ? (req.query["search"] as string).trim() || undefined : undefined;

  const opts: service.ListProductsOptions = {
    ...(status      && { status }),
    ...(sort_by     && { sort_by }),
    ...(sort_dir    && { sort_dir }),
    ...(category_id && { category_id }),
    ...(outlet_id   && { outlet_id }),
    ...(is_stockable != null && { is_stockable }),
    ...(low_stock   && { low_stock }),
    ...(search      && { search }),
  };

  const result = await service.listProducts(page, limit, req.admin!.store_id, opts);
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProductById(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  // Products are global (store_id = null) — visible across all stores.
  const product = await service.createProduct({ ...req.body, store_id: null, created_by: req.admin!.id });
  sendSuccess(res, product, "Product created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.updateProduct(Number(req.params["id"]), req.body, req.admin!.store_id);
  sendSuccess(res, product, "Product updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteProduct(Number(req.params["id"]), req.admin!.store_id, req.admin!.id);
  sendSuccess(res, null, "Product deleted");
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.changeProductStatus(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, product, "Product status updated");
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  await service.restoreProduct(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, null, "Product restored successfully");
});

// ── Variants ──────────────────────────────────────────────────────────────────

export const listVariants = asyncHandler(async (req: Request, res: Response) => {
  const variants = await variantService.listVariants(Number(req.params["id"]));
  sendSuccess(res, variants);
});

export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const existingCount = await variantService.listVariants(Number(req.params["id"]));
  const variant = await variantService.createVariant(Number(req.params["id"]), req.body, existingCount.length);
  sendSuccess(res, variant, "Variant created", 201);
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await variantService.updateVariant(Number(req.params["variantId"]), Number(req.params["id"]), req.body);
  sendSuccess(res, variant, "Variant updated");
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  await variantService.deleteVariant(Number(req.params["variantId"]), Number(req.params["id"]));
  sendSuccess(res, null, "Variant deleted");
});

// ── Media ─────────────────────────────────────────────────────────────────────

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.getProductMedia(Number(req.params["id"]));
  sendSuccess(res, media);
});

export const addMedia = asyncHandler(async (req: Request, res: Response) => {
  const { media_id, is_primary, variant_id } = req.body;
  if (!media_id) throw Object.assign(new Error("media_id is required"), { statusCode: 400 });
  if (!variant_id) throw Object.assign(new Error("variant_id is required — images must be assigned to a variant"), { statusCode: 400 });
  const entry = await mediaService.addProductMedia(Number(req.params["id"]), Number(media_id), is_primary, Number(variant_id));
  sendSuccess(res, entry, "Image added", 201);
});

export const getVariantMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.getVariantMedia(Number(req.params["id"]), Number(req.params["variantId"]));
  sendSuccess(res, media);
});

export const setPrimaryMedia = asyncHandler(async (req: Request, res: Response) => {
  const entry = await mediaService.setPrimary(Number(req.params["id"]), Number(req.params["mediaId"]));
  sendSuccess(res, entry, "Primary image updated");
});

export const reorderMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.reorderProductMedia(Number(req.params["id"]), req.body.ordered_ids);
  sendSuccess(res, media, "Images reordered");
});

export const removeMedia = asyncHandler(async (req: Request, res: Response) => {
  await mediaService.removeProductMedia(Number(req.params["id"]), Number(req.params["mediaId"]));
  sendSuccess(res, null, "Image removed");
});

// ── Pricing ───────────────────────────────────────────────────────────────────

export const listPrices = asyncHandler(async (req: Request, res: Response) => {
  const prices = await pricingService.listPrices(Number(req.params["id"]));
  sendSuccess(res, prices);
});

export const createPrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await pricingService.createPrice(Number(req.params["id"]), req.body);
  sendSuccess(res, price, "Price rule created", 201);
});

export const updatePrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await pricingService.updatePrice(Number(req.params["priceId"]), Number(req.params["id"]), req.body);
  sendSuccess(res, price, "Price rule updated");
});

export const deletePrice = asyncHandler(async (req: Request, res: Response) => {
  await pricingService.deletePrice(Number(req.params["priceId"]), Number(req.params["id"]));
  sendSuccess(res, null, "Price rule deleted");
});

// ── Inventory ─────────────────────────────────────────────────────────────────

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const inventory = await inventoryService.listInventory(Number(req.params["id"]), req.admin!.store_id);
  sendSuccess(res, inventory);
});

export const createInventory = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  if (store_id == null) {
    throw Object.assign(new Error("Your account is not assigned to a store."), { statusCode: 400 });
  }
  const record = await inventoryService.createInventoryRecord(Number(req.params["id"]), req.body, store_id);
  sendSuccess(res, record, "Inventory record created", 201);
});

export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const record = await inventoryService.updateInventoryRecord(Number(req.params["invId"]), Number(req.params["id"]), req.body);
  sendSuccess(res, record, "Inventory updated");
});

export const deleteInventory = asyncHandler(async (req: Request, res: Response) => {
  await inventoryService.deleteInventoryRecord(Number(req.params["invId"]), Number(req.params["id"]));
  sendSuccess(res, null, "Inventory record deleted");
});

// ── Return Policy ──────────────────────────────────────────────────────────────

export const getReturnPolicy = asyncHandler(async (req: Request, res: Response) => {
  const items = await returnPolicyService.getReturnPolicy(Number(req.params["id"]));
  sendSuccess(res, items);
});

export const saveReturnPolicy = asyncHandler(async (req: Request, res: Response) => {
  const { config_item_ids } = req.body;
  if (!Array.isArray(config_item_ids)) {
    throw Object.assign(new Error("config_item_ids must be an array"), { statusCode: 400 });
  }
  const items = await returnPolicyService.saveReturnPolicy(Number(req.params["id"]), config_item_ids);
  sendSuccess(res, items, "Return policy saved");
});
