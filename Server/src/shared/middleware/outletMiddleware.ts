import type { Request, Response, NextFunction } from "express";
import { Outlet } from "../../models/index";

/**
 * Client outlet middleware.
 * Reads `outlet_id` or `outlet_ids` (comma-separated) from the query string,
 * validates each outlet exists and is active, then attaches the validated IDs
 * to `req.outletIds` (ordered as supplied by the caller — mobile sends nearest first).
 *
 * No role or auth check is performed. Call next() even when no outlet param is
 * present so public routes continue to work without an outlet context.
 */
export const outletMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = (req.query["outlet_ids"] ?? req.query["outlet_id"]) as string | undefined;
    if (!raw) return next();

    const ids = raw
      .split(",")
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0);

    if (ids.length === 0) return next();

    const outlets = await Outlet.findAll({
      where: { id: ids, is_deleted: false, status: true },
      attributes: ["id"],
    });

    const validSet = new Set(outlets.map(o => o.id));
    // Keep caller's order (nearest → farthest) but drop any invalid IDs
    req.outletIds = ids.filter(id => validSet.has(id));
    next();
  } catch {
    next(); // fail open — don't block the request
  }
};
