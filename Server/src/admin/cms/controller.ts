import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";

// Use the admin's store_id as the layout key; fall back to "global" for
// super-admins who have no store assigned.
function layoutKey(req: Request) {
  const storeId = req.admin!.store_id;
  return storeId != null ? String(storeId) : "global";
}

function layoutPath(key: string) {
  return path.resolve("uploads/cms", `homepage_${key}.json`);
}

function categoryLayoutPath(key: string, slug?: string) {
  const name = slug ? `category_${slug}_${key}` : `category_${key}`;
  return path.resolve("uploads/cms", `${name}.json`);
}

function productListingPath(key: string) {
  return path.resolve("uploads/cms", `product-listing_${key}.json`);
}

function productDetailPath(key: string) {
  return path.resolve("uploads/cms", `product-detail_${key}.json`);
}

function loginPagePath(key: string) {
  return path.resolve("uploads/cms", `login-page_${key}.json`);
}

function cartPagePath(key: string) {
  return path.resolve("uploads/cms", `cart-page_${key}.json`);
}

function paymentPagePath(key: string) {
  return path.resolve("uploads/cms", `payment-page_${key}.json`);
}

function accountPagePath(key: string) {
  return path.resolve("uploads/cms", `account-page_${key}.json`);
}

function checkoutPagePath(key: string) {
  return path.resolve("uploads/cms", `checkout-page_${key}.json`);
}

export const getHomepageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = layoutPath(layoutKey(req));
  if (!fs.existsSync(file)) {
    return sendSuccess(res, { components: [] });
  }
  const components = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, { components });
});

export const saveHomepageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { components } = req.body;
  if (!Array.isArray(components)) {
    return sendError(res, "components must be an array", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(layoutPath(layoutKey(req)), JSON.stringify(components), "utf-8");
  sendSuccess(res, null, "Layout saved");
});

export const getCategoryLayout = asyncHandler(async (req: Request, res: Response) => {
  const slug = typeof req.query.slug === "string" ? req.query.slug : undefined;
  const file = categoryLayoutPath(layoutKey(req), slug);
  if (!fs.existsSync(file)) {
    return sendSuccess(res, { components: [], subcategory_bar: null });
  }
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveCategoryLayout = asyncHandler(async (req: Request, res: Response) => {
  const { components, subcategory_bar } = req.body;
  if (!Array.isArray(components)) {
    return sendError(res, "components must be an array", 400);
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : undefined;
  const dir  = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(categoryLayoutPath(layoutKey(req), slug), JSON.stringify({ components, subcategory_bar }), "utf-8");
  sendSuccess(res, null, "Category layout saved");
});

export const getProductListingLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = productListingPath(layoutKey(req));
  if (!fs.existsSync(file)) {
    return sendSuccess(res, { config: null });
  }
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveProductListingLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(productListingPath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Product listing layout saved");
});

export const getProductDetailLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = productDetailPath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveProductDetailLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(productDetailPath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Product detail layout saved");
});

export const getLoginPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = loginPagePath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveLoginPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(loginPagePath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Login page layout saved");
});

export const getCartPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = cartPagePath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveCartPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(cartPagePath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Cart page layout saved");
});

export const getAccountPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = accountPagePath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveAccountPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(accountPagePath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Account page layout saved");
});

export const getCheckoutPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = checkoutPagePath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const saveCheckoutPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(checkoutPagePath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Checkout page layout saved");
});

export const getPaymentPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const file = paymentPagePath(layoutKey(req));
  if (!fs.existsSync(file)) return sendSuccess(res, { config: null });
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  sendSuccess(res, data);
});

export const savePaymentPageLayout = asyncHandler(async (req: Request, res: Response) => {
  const { config } = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return sendError(res, "config must be an object", 400);
  }

  const dir = path.resolve("uploads/cms");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(paymentPagePath(layoutKey(req)), JSON.stringify({ config }), "utf-8");
  sendSuccess(res, null, "Payment page layout saved");
});
