// CMS layout cache
// Fetches the homepage layout from the backend API (GET /api/cms/homepage).
// The server responds with Cache-Control: max-age=1800 (30 min).
// On the frontend we additionally cache in-memory so the same page visit
// never fires more than one network request.

const BASE_CMS = import.meta.env.VITE_CMS_BASE
const API_URL  = `${BASE_CMS}/homepage`

let _session = undefined // undefined = not yet fetched; null = fetched, nothing found

export async function getCmsLayout() {
  if (_session !== undefined) return _session

  try {
    const res = await fetch(API_URL)
    if (!res.ok) { _session = null; return null }

    const json = await res.json()
    const components = json?.data?.components
    _session = Array.isArray(components) && components.length > 0 ? components : null
  } catch {
    _session = null
  }

  return _session
}

// Call after a successful admin save to keep the in-memory cache in sync
// without forcing a full page reload.
export function invalidateCmsLayout() {
  _session = undefined
}

// ─── Category layout ──────────────────────────────────────────────────────────
// Per-slug cache: { [slug|'__base__']: { components, subcategory_bar } | null }
const _categoryCache = {}

export async function getCategoryLayout(slug) {
  const key = slug || '__base__'
  if (key in _categoryCache) return _categoryCache[key]

  const url = slug
    ? `${BASE_CMS}/category?slug=${encodeURIComponent(slug)}`
    : `${BASE_CMS}/category`

  try {
    const res = await fetch(url)
    if (!res.ok) { _categoryCache[key] = null; return null }
    const json = await res.json()
    const data = json?.data
    _categoryCache[key] = (data?.components?.length || data?.subcategory_bar) ? data : null
  } catch {
    _categoryCache[key] = null
  }

  return _categoryCache[key]
}

export function invalidateCategoryLayout(slug) {
  const key = slug || '__base__'
  delete _categoryCache[key]
}

// ─── Product listing layout ───────────────────────────────────────────────────
// Always fetches fresh (no-store) so Admin saves are immediately visible.

export async function getProductListingLayout() {
  try {
    const res = await fetch(`${BASE_CMS}/product-listing`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    const config = json?.data?.config
    return config ?? null
  } catch {
    return null
  }
}

export function invalidateProductListingLayout() {
  // no-op: kept for API compatibility
}

// ─── Product detail layout ────────────────────────────────────────────────────
let _productDetailCache = undefined

export async function getProductDetailLayout() {
  if (_productDetailCache !== undefined) return _productDetailCache

  try {
    const res = await fetch(`${BASE_CMS}/product-detail`)
    if (!res.ok) { _productDetailCache = null; return null }
    const json = await res.json()
    const config = json?.data?.config
    _productDetailCache = config ? config : null
  } catch {
    _productDetailCache = null
  }

  return _productDetailCache
}

export function invalidateProductDetailLayout() {
  _productDetailCache = undefined
}

// ─── Login page layout ────────────────────────────────────────────────────────
let _loginPageCache = undefined

export async function getLoginPageLayout() {
  if (_loginPageCache !== undefined) return _loginPageCache

  try {
    const res = await fetch(`${BASE_CMS}/login-page`)
    if (!res.ok) { _loginPageCache = null; return null }
    const json = await res.json()
    const config = json?.data?.config
    _loginPageCache = config ? config : null
  } catch {
    _loginPageCache = null
  }

  return _loginPageCache
}

export function invalidateLoginPageLayout() {
  _loginPageCache = undefined
}

// ─── Cart page layout ─────────────────────────────────────────────────────────
// Always fetches fresh so Admin saves are immediately visible.

export async function getCartPageLayout() {
  try {
    const res = await fetch(`${BASE_CMS}/cart-page`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.config ?? null
  } catch {
    return null
  }
}

// ─── Checkout page layout ─────────────────────────────────────────────────────
// Always fetches fresh so Admin saves are immediately visible.

export async function getCheckoutPageLayout() {
  try {
    const res = await fetch(`${BASE_CMS}/checkout`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.config ?? null
  } catch {
    return null
  }
}

// Fetches the navbar config — always makes a fresh fetch so it reflects the latest save.
export async function getNavbarConfig() {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return null
    const json = await res.json()
    const components = json?.data?.components
    if (!Array.isArray(components)) return null
    const nav = components.find(c => c.type === 'navbar')
    if (!nav) return null
    return { id: nav.id, config: nav.config }
  } catch {
    return null
  }
}

// Fetches the announcement bar directly — bypasses the shared in-memory cache
// so the bar always reflects the latest saved layout regardless of cache state.
export async function getAnnouncementBarConfig() {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return null
    const json = await res.json()
    const components = json?.data?.components
    if (!Array.isArray(components)) return null
    const bar = components.find(
      c => c.type === 'announcement-bar' && c.config?.position !== 'in-page'
    )
    if (!bar) return null
    return { id: bar.id, config: bar.config }
  } catch {
    return null
  }
}
