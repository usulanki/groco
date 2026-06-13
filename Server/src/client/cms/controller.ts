import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";

function readFirstCmsFile(prefix: string): object | null {
  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.startsWith(`${prefix}_`) && f.endsWith(".json"));
  if (!files[0]) return null;
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf-8"));
}

export const getHomepageLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  // If a specific store_id is requested, try that file first
  if (storeId) {
    const file = path.resolve("uploads/cms", `homepage_${storeId}.json`);
    if (fs.existsSync(file)) {
      const components = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800"); // 30 min
      return sendSuccess(res, { components });
    }
  }

  // Fallback: return the first layout file found (single-store setups)
  const fallback = readFirstCmsFile("homepage") as { components?: unknown } | null;
  if (fallback) {
    res.setHeader("Cache-Control", "public, max-age=1800"); // 30 min
    return sendSuccess(res, { components: fallback.components ?? fallback });
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { components: [] });
});

export const getProductListingLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  if (storeId) {
    const file = path.resolve("uploads/cms", `product-listing_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile("product-listing");
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { config: null });
});

export const getProductDetailLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  if (storeId) {
    const file = path.resolve("uploads/cms", `product-detail_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile("product-detail");
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { config: null });
});

export const getLoginPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  if (storeId) {
    const file = path.resolve("uploads/cms", `login-page_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile("login-page");
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { config: null });
});

export const getAccountPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  if (storeId) {
    const file = path.resolve("uploads/cms", `account-page_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile("account-page");
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { config: null });
});

export const getCartPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;

  if (storeId) {
    const file = path.resolve("uploads/cms", `cart-page_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile("cart-page");
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { config: null });
});

export const getCategoryLayout = asyncHandler(async (req: Request, res: Response) => {
  const storeId = req.query.store_id ? Number(req.query.store_id) : null;
  const slug    = typeof req.query.slug === "string" ? req.query.slug : undefined;
  const prefix  = slug ? `category_${slug}` : "category";

  if (storeId) {
    const file = path.resolve("uploads/cms", `${prefix}_${storeId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      res.setHeader("Cache-Control", "public, max-age=1800");
      return sendSuccess(res, data);
    }
  }

  const data = readFirstCmsFile(prefix);
  if (data) {
    res.setHeader("Cache-Control", "public, max-age=1800");
    return sendSuccess(res, data);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  sendSuccess(res, { components: [], subcategory_bar: null });
});
