import { Request, Response, NextFunction } from "express";
import sequelize from "../../config/database";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const [rows] = await sequelize.query(
      `SELECT id, name, slug, description, icon, route, sort_order, parent_id, is_active
         FROM setting_menus
        WHERE is_active = 1
        ORDER BY sort_order ASC`
    ) as [Array<{
      id: number; name: string; slug: string; description: string | null;
      icon: string | null; route: string; sort_order: number;
      parent_id: number | null; is_active: number;
    }>, unknown];

    const data = rows.map((r) => ({ ...r, is_active: Boolean(r.is_active) }));
    res.json({ success: true, data });
  } catch {
    // Table may not exist yet — return empty so frontend uses static fallback
    res.json({ success: true, data: [] });
  }
}
