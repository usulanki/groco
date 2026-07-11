import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY   = 'groco_delivery_token';
const REFRESH_KEY = 'groco_delivery_refresh';
const AGENT_KEY   = 'groco_delivery_agent';

export interface StoredAgent {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string;
  store_id: number | null;
  outlet_id: number | null;
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  return SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getStoredAgent(): Promise<StoredAgent | null> {
  const raw = await SecureStore.getItemAsync(AGENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAgent;
  } catch {
    return null;
  }
}

export async function setStoredAgent(agent: StoredAgent): Promise<void> {
  return SecureStore.setItemAsync(AGENT_KEY, JSON.stringify(agent));
}

export async function clearStoredAgent(): Promise<void> {
  return SecureStore.deleteItemAsync(AGENT_KEY);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([clearAuthToken(), clearRefreshToken(), clearStoredAgent()]);
}

// ── Active delivery order ─────────────────────────────────────────────────────

const ACTIVE_ORDER_KEY = 'groco_delivery_active_order';

export async function getActiveOrderId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_ORDER_KEY);
}

export async function setActiveOrderId(id: string): Promise<void> {
  return SecureStore.setItemAsync(ACTIVE_ORDER_KEY, id);
}

export async function clearActiveOrderId(): Promise<void> {
  return SecureStore.deleteItemAsync(ACTIVE_ORDER_KEY);
}
