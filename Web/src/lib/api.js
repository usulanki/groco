const BASE_URL = import.meta.env.VITE_API_URL

async function request(path) {
  const token = localStorage.getItem('access_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data
}

async function authPost(path, body) {
  const token = localStorage.getItem('access_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data
}

export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  googleLogin: (data) => post('/auth/google', data),
  facebookLogin: (data) => post('/auth/facebook', data),
  appleLogin: (data) => post('/auth/apple', data),
}

export const categoriesApi = {
  getAll: () => request('/categories'),
  getBySlug: (slug) => request(`/categories/${slug}`),
}

export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, v) })
    return request(`/products?${qs.toString()}`)
  },
  getById: (id) => request(`/products/${encodeURIComponent(id)}`),
}

export const reviewsApi = {
  getByProduct: (productId) => request(`/reviews/${productId}`),
}

export const ordersApi = {
  list:    () => request('/orders'),
  getById: (id) => request(`/orders/${id}`),
}

async function authDelete(path) {
  const token = localStorage.getItem('access_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data
}

async function authPatch(path) {
  const token = localStorage.getItem('access_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${BASE_URL}${path}`, { method: 'PATCH', headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request failed: ${res.status}`)
  return json.data
}

export const cartApi = {
  get: () => request('/cart'),
  add: (productId, quantity = 1, variantId) => authPost('/cart', { productId, quantity, ...(variantId != null ? { variantId } : {}) }),
  decrement: (productId) => authPatch(`/cart/${productId}/decrement`),
  remove: (productId) => authDelete(`/cart/${productId}`),
}

export const wishlistApi = {
  get: () => request('/wishlist'),
  add: (productId) => authPost('/wishlist', { productId }),
  remove: (productId) => authDelete(`/wishlist/${productId}`),
}

export const paymentsApi = {
  createIntent:   (data) => authPost('/payments/create-intent',   data),
  confirm:        (data) => authPost('/payments/confirm',         data),
  razorpayCreate: (data) => authPost('/payments/razorpay-create', data),
  razorpayVerify: (data) => authPost('/payments/razorpay-verify', data),
}

export const addressApi = {
  get: () => request('/addresses'),
  create: (data) => authPost('/addresses', data),
  remove: (id) => authDelete(`/addresses/${id}`),
}

export const locationsApi = {
  states: () => request('/locations/states'),
  cities: (stateId) => request(`/locations/cities?state_id=${stateId}`),
}

