import Outlet from "../../models/outlet.model";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const getNearbyOutlets = async (
  agentStoreId:  number | null,
  agentOutletId: number | null,
  lat?: number,
  lng?: number,
) => {
  let outlets: Outlet[];

  if (agentOutletId) {
    outlets = await Outlet.findAll({
      where: { id: agentOutletId, is_deleted: false, status: true },
      attributes: ["id", "name", "address1", "city", "state", "latitude", "longitude", "serviceable_distance_km", "instant_delivery_enabled"],
    });

  } else if (agentStoreId) {
    outlets = await Outlet.findAll({
      where: { store_id: agentStoreId, is_deleted: false, status: true },
      attributes: ["id", "name", "address1", "city", "state", "latitude", "longitude", "serviceable_distance_km", "instant_delivery_enabled"],
    });

  } else {
    const all = await Outlet.findAll({
      where: { is_deleted: false, status: true },
      attributes: ["id", "name", "address1", "city", "state", "latitude", "longitude", "serviceable_distance_km", "instant_delivery_enabled"],
    });

    outlets = all.filter(o => {
      // Outlet has no coordinates — include it (no way to check radius)
      if (o.latitude == null || o.longitude == null) return true;
      // Agent has no location — include all
      if (lat == null || lng == null) return true;
      return haversineKm(lat, lng, Number(o.latitude), Number(o.longitude)) <= o.serviceable_distance_km;
    });
  }

  return outlets.map(o => {
    const plain = o.toJSON() as Record<string, unknown>;
    const distanceKm =
      lat != null && lng != null && o.latitude != null && o.longitude != null
        ? parseFloat(haversineKm(lat, lng, Number(o.latitude), Number(o.longitude)).toFixed(2))
        : null;
    return { ...plain, distance_km: distanceKm };
  }).sort((a, b) => {
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return (a.distance_km as number) - (b.distance_km as number);
  });
};
