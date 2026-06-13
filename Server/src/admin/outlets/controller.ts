import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import { Outlet, Admin, Role } from "../../models/index";

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (req.admin!.role_code !== "SUPERADMIN") {
    sendError(res, "Forbidden", 403);
    return false;
  }
  return true;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const store_id = req.admin!.store_id;
  const where: Record<string, unknown> = { is_deleted: false };
  if (store_id !== null) {
    where["store_id"] = store_id;
  } else if (req.query["store_id"]) {
    where["store_id"] = Number(req.query["store_id"]);
  }

  const outlets = await Outlet.findAll({
    where,
    attributes: ["id", "name", "location", "city", "status", "store_id"],
    order: [["name", "ASC"]],
  });
  sendSuccess(res, outlets);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const store_id = req.admin!.store_id;

  const outlet = await Outlet.findOne({
    where: { id, is_deleted: false, ...(store_id !== null ? { store_id } : {}) },
    include: [
      {
        model: Admin,
        as: "manager",
        attributes: ["id", "fname", "lname", "email", "phone"],
        required: false,
      },
    ],
  });

  if (!outlet) return sendError(res, "Outlet not found", 404);

  const admins = outlet.get("manager")
    ? await Admin.findAll({
        where: { id: (outlet.get("manager") as any).id, is_deleted: false },
        include: [{ model: Role, attributes: ["name"] }],
        attributes: ["id", "fname", "lname"],
      })
    : [];

  const manager = outlet.get("manager") as any;

  sendSuccess(res, {
    id: outlet.id,
    name: outlet.name,
    address: outlet.address1,
    city: outlet.city,
    state: outlet.state,
    pincode: outlet.pincode,
    latitude: outlet.latitude,
    longitude: outlet.longitude,
    status: outlet.status ? "active" : "inactive",
    created_ts: outlet.created_ts,
    manager: manager
      ? {
          id: manager.id,
          fname: manager.fname,
          lname: manager.lname,
          email: manager.email,
          phone: manager.phone ?? null,
        }
      : null,
    admins: admins.map((a: any) => ({
      id: a.id,
      fname: a.fname,
      lname: a.lname,
      role: a.Role?.name ?? "",
    })),
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const { store_id, name, location, address1, address2, city, state, pincode, latitude, longitude } = req.body;
  if (!store_id || !name) return sendError(res, "store_id and name are required", 400);

  const outlet = await Outlet.create({
    store_id: Number(store_id),
    name,
    location: location ?? null,
    address1: address1 ?? null,
    address2: address2 ?? null,
    city: city ?? null,
    state: state ?? null,
    pincode: pincode ?? null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    status: true,
    is_deleted: false,
    created_by: req.admin!.id,
  });
  sendSuccess(res, outlet.toJSON(), "Outlet created", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const id = Number(req.params.id);
  const outlet = await Outlet.findOne({ where: { id, is_deleted: false } });
  if (!outlet) return sendError(res, "Outlet not found", 404);

  const { name, location, address1, address2, city, state, pincode, latitude, longitude } = req.body;
  await outlet.update({
    ...(name      !== undefined && { name }),
    ...(location  !== undefined && { location }),
    ...(address1  !== undefined && { address1 }),
    ...(address2  !== undefined && { address2 }),
    ...(city      !== undefined && { city }),
    ...(state     !== undefined && { state }),
    ...(pincode   !== undefined && { pincode }),
    ...(latitude  !== undefined && { latitude: latitude ? Number(latitude) : null }),
    ...(longitude !== undefined && { longitude: longitude ? Number(longitude) : null }),
  });
  sendSuccess(res, outlet.toJSON(), "Outlet updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const id = Number(req.params.id);
  const outlet = await Outlet.findOne({ where: { id, is_deleted: false } });
  if (!outlet) return sendError(res, "Outlet not found", 404);
  await outlet.update({ is_deleted: true });
  sendSuccess(res, { id }, "Outlet deleted");
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;
  const id = Number(req.params.id);
  const outlet = await Outlet.findOne({ where: { id, is_deleted: false } });
  if (!outlet) return sendError(res, "Outlet not found", 404);
  await outlet.update({ status: !outlet.status });
  sendSuccess(res, outlet.toJSON(), "Outlet status updated");
});
