import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import { Outlet } from "../../models/index";

const HARD_LIMIT_KM = 50;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const deliveryEstimate = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return sendError(res, "lat and lng are required", 400);
  }

  const outlets = await Outlet.findAll({
    where: { is_deleted: false, status: true },
    attributes: ["id", "name", "latitude", "longitude", "serviceable_distance_km", "delivery_charge_per_km"],
  });

  // Find nearest serviceable outlet
  let best: { outlet: typeof outlets[0]; distanceKm: number } | null = null;
  for (const o of outlets) {
    if (o.latitude == null || o.longitude == null) continue;
    const distanceKm = haversineKm(lat, lng, Number(o.latitude), Number(o.longitude));
    if (distanceKm > o.serviceable_distance_km) continue;
    if (!best || distanceKm < best.distanceKm) best = { outlet: o, distanceKm };
  }

  if (!best) {
    // No serviceable outlet found — fallback: use first active outlet with no distance calc
    const fallback = outlets[0];
    return sendSuccess(res, {
      outlet_id: fallback?.id ?? null,
      distance_km: null,
      delivery_charge: 0,
    });
  }

  const deliveryCharge =
    Math.round(best.distanceKm * Number(best.outlet.delivery_charge_per_km ?? 10) * 100) / 100;

  sendSuccess(res, {
    outlet_id: best.outlet.id,
    distance_km: Math.round(best.distanceKm * 100) / 100,
    delivery_charge: deliveryCharge,
  });
});

export const nearby = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return sendError(res, "lat and lng are required", 400);
  }

  const outlets = await Outlet.findAll({
    where: { is_deleted: false, status: true },
    attributes: ["id", "name", "latitude", "longitude", "serviceable_distance_km", "store_id"],
  });

  const matched = outlets
    .filter((o) => o.latitude != null && o.longitude != null)
    .map((o) => ({
      id: o.id,
      name: o.name,
      store_id: o.store_id,
      serviceable_distance_km: o.serviceable_distance_km,
      distance_km: haversineKm(lat, lng, Number(o.latitude), Number(o.longitude)),
    }))
    .filter((o) => o.distance_km <= HARD_LIMIT_KM && o.distance_km <= o.serviceable_distance_km)
    .sort((a, b) => a.distance_km - b.distance_km);

  sendSuccess(res, {
    serviceable: matched.length > 0,
    outlets: matched.map((o) => ({
      id: o.id,
      name: o.name,
      store_id: o.store_id,
      distance_km: Math.round(o.distance_km * 10) / 10,
    })),
  });
});
