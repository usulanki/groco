import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import { Outlet, Admin, Role } from "../../models/index";
import type { DeliverySlots } from "../../models/outlet.model";

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;

const DEFAULT_SLOTS: DeliverySlots = Object.fromEntries(
  DAYS.map(d => [d, { enabled: d !== "sunday", open: "09:00", close: "21:00" }])
) as DeliverySlots;

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (req.admin!.role_code !== "SUPERADMIN") {
    sendError(res, "Forbidden", 403);
    return false;
  }
  return true;
}

function requireAdminOrSuperAdmin(req: Request, res: Response): boolean {
  const role = req.admin!.role_code;
  if (role !== "SUPERADMIN" && role !== "ADMIN") {
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
    attributes: ["id", "name", "location", "city", "status", "store_id", "instant_delivery_enabled", "slot_delivery_enabled", "serviceable_distance_km", "delivery_charge_per_km", "latitude", "longitude"],
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
    instant_delivery_enabled: outlet.instant_delivery_enabled,
    slot_delivery_enabled: outlet.slot_delivery_enabled,
    delivery_slots: outlet.delivery_slots,
    serviceable_distance_km: outlet.serviceable_distance_km,
    delivery_charge_per_km: outlet.delivery_charge_per_km ?? 10,
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
  const { store_id, name, location, address1, address2, city, state, pincode, latitude, longitude, serviceable_distance_km, delivery_charge_per_km } = req.body;
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
    latitude: latitude != null ? Number(latitude) : null,
    longitude: longitude != null ? Number(longitude) : null,
    serviceable_distance_km: serviceable_distance_km ? Math.min(20, Math.max(1, Number(serviceable_distance_km))) : 5,
    delivery_charge_per_km: delivery_charge_per_km != null ? Math.max(0, Number(delivery_charge_per_km)) : 10,
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

  const { name, location, address1, address2, city, state, pincode, latitude, longitude, serviceable_distance_km, delivery_charge_per_km } = req.body;
  await outlet.update({
    ...(name      !== undefined && { name }),
    ...(location  !== undefined && { location }),
    ...(address1  !== undefined && { address1 }),
    ...(address2  !== undefined && { address2 }),
    ...(city      !== undefined && { city }),
    ...(state     !== undefined && { state }),
    ...(pincode   !== undefined && { pincode }),
    ...(latitude  !== undefined ? { latitude:  latitude  != null ? Number(latitude)  : null } : {}),
    ...(longitude !== undefined ? { longitude: longitude != null ? Number(longitude) : null } : {}),
    ...(serviceable_distance_km !== undefined && {
      serviceable_distance_km: Math.min(20, Math.max(1, Number(serviceable_distance_km))),
    }),
    ...(delivery_charge_per_km !== undefined && {
      delivery_charge_per_km: Math.max(0, Number(delivery_charge_per_km)),
    }),
  });
  sendSuccess(res, outlet.toJSON(), "Outlet updated");
});

export const updateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const store_id = req.admin!.store_id;
  const outlet = await Outlet.findOne({
    where: { id, is_deleted: false, ...(store_id !== null ? { store_id } : {}) },
  });
  if (!outlet) return sendError(res, "Outlet not found", 404);

  const { instant_delivery_enabled, slot_delivery_enabled, delivery_slots } = req.body;

  const willEnableSlot = slot_delivery_enabled === true || slot_delivery_enabled === 1;
  const slotWasPreviouslyOff = !outlet.slot_delivery_enabled;

  await outlet.update({
    ...(instant_delivery_enabled !== undefined && { instant_delivery_enabled: Boolean(instant_delivery_enabled) }),
    ...(slot_delivery_enabled !== undefined && { slot_delivery_enabled: Boolean(slot_delivery_enabled) }),
    // When enabling slots for the first time with no existing slots, seed defaults
    ...(delivery_slots !== undefined
      ? { delivery_slots }
      : willEnableSlot && slotWasPreviouslyOff && !outlet.delivery_slots
        ? { delivery_slots: DEFAULT_SLOTS }
        : {}),
  });

  sendSuccess(res, {
    instant_delivery_enabled: outlet.instant_delivery_enabled,
    slot_delivery_enabled: outlet.slot_delivery_enabled,
    delivery_slots: outlet.delivery_slots,
  }, "Delivery settings updated");
});

export const updateServiceableDistance = asyncHandler(async (req: Request, res: Response) => {
  if (!requireAdminOrSuperAdmin(req, res)) return;
  const id = Number(req.params.id);
  const store_id = req.admin!.store_id;

  const outlet = await Outlet.findOne({
    where: { id, is_deleted: false, ...(store_id !== null ? { store_id } : {}) },
  });
  if (!outlet) return sendError(res, "Outlet not found", 404);

  const km = Number(req.body.serviceable_distance_km);
  if (!Number.isInteger(km) || km < 1 || km > 20) {
    return sendError(res, "serviceable_distance_km must be an integer between 1 and 20", 400);
  }

  await outlet.update({ serviceable_distance_km: km });
  sendSuccess(res, { serviceable_distance_km: outlet.serviceable_distance_km }, "Serviceable distance updated");
});

export const updateDeliveryCharge = asyncHandler(async (req: Request, res: Response) => {
  if (!requireAdminOrSuperAdmin(req, res)) return;
  const id = Number(req.params.id);
  const store_id = req.admin!.store_id;

  const outlet = await Outlet.findOne({
    where: { id, is_deleted: false, ...(store_id !== null ? { store_id } : {}) },
  });
  if (!outlet) return sendError(res, "Outlet not found", 404);

  const charge = Number(req.body.delivery_charge_per_km);
  if (isNaN(charge) || charge < 0) {
    return sendError(res, "delivery_charge_per_km must be a non-negative number", 400);
  }

  await outlet.update({ delivery_charge_per_km: charge });
  sendSuccess(res, { delivery_charge_per_km: outlet.delivery_charge_per_km }, "Delivery charge updated");
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
