import NotificationSetting from "../../models/notificationSetting.model";

export const NOTIFICATION_KEYS = [
  "order_placed",
  "order_accepted",
  "order_shipped",
  "order_cancelled",
  "order_delivered",
  "admin_created",
  "admin_updated",
  "admin_deleted",
  "admin_status_changed",
  "role_created",
  "role_updated",
  "role_deleted",
  "role_status_changed",
  "review_added",
  "review_low_rating",
  "inventory_low_threshold",
  "inventory_zero",
  "inventory_transfer",
] as const;

export type NotificationKey = typeof NOTIFICATION_KEYS[number];

// Returns all notification settings for the given admin.
// Keys that have no DB row yet are returned as enabled=true (default-on).
export const getSettings = async (adminId: number): Promise<Record<NotificationKey, boolean>> => {
  const rows = await NotificationSetting.findAll({ where: { admin_id: adminId } });
  const map = Object.fromEntries(rows.map(r => [r.key, r.enabled])) as Record<string, boolean>;

  const result = {} as Record<NotificationKey, boolean>;
  for (const key of NOTIFICATION_KEYS) {
    result[key] = key in map ? map[key]! : true;
  }
  return result;
};

// Upserts the provided key→boolean pairs for the given admin.
export const updateSettings = async (
  adminId: number,
  updates: Partial<Record<NotificationKey, boolean>>
): Promise<Record<NotificationKey, boolean>> => {
  for (const [key, enabled] of Object.entries(updates)) {
    if (!NOTIFICATION_KEYS.includes(key as NotificationKey)) continue;
    await NotificationSetting.upsert({ admin_id: adminId, key, enabled: enabled as boolean });
  }
  return getSettings(adminId);
};
