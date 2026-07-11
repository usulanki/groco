const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers: customHeaders, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(customHeaders as Record<string, string>) },
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? 'Something went wrong');
  }

  return json.data as T;
}

export const api = {
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    }),

  get: <T>(path: string, token?: string) =>
    request<T>(path, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
