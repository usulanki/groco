import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Heart, ChevronRight, ChevronDown, SlidersHorizontal, Loader2 } from 'lucide-react'
import { getProductListingLayout, getLoginPageLayout } from '../../lib/cmsCache'
import { productsApi, cartApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { useWishlist } from '../../lib/wishlist'
import { LoginModal } from './CmsLoginPage'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const DEFAULT_CONFIG = {
  header_style:          'breadcrumb-title',
  banner_bg_color:       '#f8fafc',
  banner_text_color:     '#1e293b',
  banner_height:         'sm',
  grid_columns:          5,
  card_style:            'default',
  card_radius:           'md',
  card_shadow:           false,
  show_ratings:          true,
  show_discount_badge:   true,
  show_cart_btn:         true,
  show_wishlist_btn:     true,
  cart_btn_label:        'Add to Cart',
  cart_btn_bg:           '#ffcc01',
  cart_btn_text_color:   '#1a1a1a',
  cart_btn_border_width: 0,
  cart_btn_border_color: '#ffcc01',
  cart_btn_radius:       'md',
  after_add_behavior:    'quantity',  // 'quantity' | 'go-to-cart' | 'keep-button'
  go_to_cart_label:      'Go to Cart',
  filter_position:       'sidebar-left',
  filter_style:          'checkbox',
  show_category_filter:  true,
  show_price_filter:     true,
  show_brand_filter:     true,
  show_rating_filter:    true,
  show_discount_filter:  false,
  show_sort:             true,
  default_sort:          'newest',
  show_result_count:     true,
  pagination_style:      'numbered',
  products_per_page:     24,
}

const RADIUS_CLS = { none: '', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl' }

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevance' },
  { value: 'newest',     label: 'Newest First' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'popular',    label: 'Most Popular' },
]

function formatPrice(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`
}

function discountPct(sellPrice, compareAt) {
  if (!compareAt || Number(compareAt) <= Number(sellPrice)) return null
  return Math.round((compareAt - sellPrice) / compareAt * 100)
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, config, onNeedLogin }) {
  const { isAuthenticated } = useAuth()
  const { cartMap, addItem, decrementItem } = useCart()
  const { wishlistSet, toggleWishlist } = useWishlist()
  const qty       = cartMap[product.id] ?? 0
  const maxCart   = (product.max_cart != null && product.max_cart > 0) ? product.max_cart : null
  const atMax     = maxCart !== null && qty >= maxCart
  const isWished  = wishlistSet.has(product.id)
  const [busy, setBusy] = useState(false)
  const [wishBusy, setWishBusy] = useState(false)

  const price      = product.prices?.[0]
  const sellPrice  = price ? (price.final_price ?? price.price) : null
  const compareAt  = price?.compare_at_price ?? null
  const discount   = discountPct(sellPrice, compareAt)
  const image      = product.images?.find(img => img.ProductMedia?.is_primary) ?? product.images?.[0]
  const imgSrc     = image?.path ? `${MEDIA_BASE}${image.path}` : null
  const isMinimal  = config.card_style === 'minimal'
  const isCompact  = config.card_style === 'compact'
  const isOutlined = config.card_style === 'outlined'
  const radius     = RADIUS_CLS[config.card_radius] ?? 'rounded-md'
  const btnRadius  = RADIUS_CLS[config.cart_btn_radius] ?? 'rounded-md'
  const border     = isOutlined ? 'border-2 border-slate-200' : isMinimal ? '' : 'border border-slate-200'
  const shadow     = config.card_shadow ? 'shadow-md hover:shadow-lg' : 'hover:shadow-md'
  const btnStyle   = {
    backgroundColor: config.cart_btn_bg,
    color: config.cart_btn_text_color,
    border: config.cart_btn_border_width > 0
      ? `${config.cart_btn_border_width}px solid ${config.cart_btn_border_color}`
      : 'none',
  }

  async function handleAdd(e) {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) {
      localStorage.setItem('pendingCartItem', JSON.stringify({ productId: product.id, quantity: 1 }))
      onNeedLogin?.()
      return
    }
    setBusy(true)
    try { await addItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleIncrement(e) {
    e.preventDefault(); e.stopPropagation()
    setBusy(true)
    try { await addItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleDecrement(e) {
    e.preventDefault(); e.stopPropagation()
    setBusy(true)
    try { await decrementItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleWishlist(e) {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) {
      localStorage.setItem('pendingWishlistItem', JSON.stringify({ productId: product.id }))
      onNeedLogin?.()
      return
    }
    setWishBusy(true)
    try { await toggleWishlist(product.id) } catch {}
    setWishBusy(false)
  }

  return (
    <Link
      to={`/product/${product.slug ?? product.id}`}
      className={`bg-white overflow-hidden flex flex-col no-underline transition-shadow ${radius} ${border} ${shadow}`}
    >
      {/* Image */}
      <div className={`relative bg-slate-100 overflow-hidden ${isCompact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {imgSrc
          ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-slate-300 text-sm">No image</span></div>
        }
        {config.show_discount_badge && discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded leading-none">
            -{discount}%
          </span>
        )}
        {config.show_wishlist_btn && (
          <button
            onClick={handleWishlist}
            disabled={wishBusy}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className={`flex flex-col flex-1 ${isCompact ? 'gap-1 p-2' : 'gap-1 p-2 sm:gap-1.5 sm:p-3'}`}>
        {!isMinimal && product.Category?.name && (
          <p className="text-xs text-slate-400 truncate">{product.Category.name}</p>
        )}
        <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{product.name}</p>

        {config.show_ratings && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
            ))}
            <span className="text-xs text-slate-400 ml-0.5">(4.0)</span>
          </div>
        )}

        {sellPrice != null && (
          <div className="flex items-center gap-2 mt-auto flex-wrap">
            <span className="font-bold text-slate-900">{formatPrice(sellPrice)}</span>
            {compareAt && Number(compareAt) > Number(sellPrice) && !isMinimal && (
              <span className="text-sm text-slate-400 line-through">{formatPrice(compareAt)}</span>
            )}
          </div>
        )}

        {config.show_cart_btn && !isMinimal && (
          qty > 0 && config.after_add_behavior === 'go-to-cart' ? (
            <Link
              to="/cart"
              onClick={e => e.stopPropagation()}
              className={`w-full py-2 text-sm font-semibold mt-1 text-center no-underline transition-opacity hover:opacity-90 ${btnRadius}`}
              style={btnStyle}
            >
              {config.go_to_cart_label}
            </Link>
          ) : qty > 0 && config.after_add_behavior === 'quantity' ? (
            <div className={`flex items-center mt-1 overflow-hidden ${btnRadius}`} style={btnStyle}>
              <button
                onClick={handleDecrement}
                disabled={busy}
                className="px-3 py-2 text-base font-bold leading-none hover:opacity-80 disabled:opacity-50 transition-opacity"
              >−</button>
              <span className="flex-1 text-center text-sm font-semibold">{qty}{atMax ? ` / ${maxCart}` : ''}</span>
              <button
                onClick={handleIncrement}
                disabled={busy || atMax}
                className="px-3 py-2 text-base font-bold leading-none hover:opacity-80 disabled:opacity-50 transition-opacity"
              >+</button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={busy || atMax}
              className={`w-full py-2 text-sm font-semibold mt-1 disabled:opacity-60 transition-opacity ${btnRadius}`}
              style={btnStyle}
            >
              {busy ? '...' : config.cart_btn_label}
            </button>
          )
        )}
      </div>
    </Link>
  )
}

// ─── Grid columns class ───────────────────────────────────────────────────────

const GRID_COLS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({ config, filters, onFiltersChange }) {
  const [priceMin, setPriceMin] = useState(filters.price_min ?? '')
  const [priceMax, setPriceMax] = useState(filters.price_max ?? '')

  function applyPrice(e) {
    e.preventDefault()
    onFiltersChange({ ...filters, price_min: priceMin || undefined, price_max: priceMax || undefined })
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-5 pr-5 border-r border-slate-200">
      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4" /> Filters
      </p>

      {config.show_price_filter && (
        <FilterSection label="Price Range">
          {config.filter_style === 'chips' ? (
            <div className="flex flex-wrap gap-1.5">
              {['Under ₹500', '₹500–1K', '₹1K–2K', '₹2K+'].map((r, i) => (
                <button key={r} className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${i === 0 ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{r}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={applyPrice} className="flex gap-1.5 items-center">
              <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="w-0 flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs" />
              <span className="text-slate-300">–</span>
              <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="w-0 flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs" />
              <button type="submit" className="px-2 py-1.5 bg-slate-800 text-white text-xs rounded font-medium">Go</button>
            </form>
          )}
        </FilterSection>
      )}

      {config.show_brand_filter && (
        <FilterSection label="Brand">
          {config.filter_style === 'dropdown' ? (
            <select className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600">
              <option value="">All brands</option>
            </select>
          ) : config.filter_style === 'chips' ? (
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Brand A', 'Brand B'].map((b, i) => (
                <button key={b} className={`px-2.5 py-1 rounded-full border text-xs font-medium ${i === 0 ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{b}</button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {['Brand A', 'Brand B', 'Brand C'].map(b => (
                <label key={b} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded accent-orange-500" />
                  <span className="text-xs text-slate-600">{b}</span>
                </label>
              ))}
            </div>
          )}
        </FilterSection>
      )}

      {config.show_rating_filter && (
        <FilterSection label="Rating">
          <div className="flex flex-col gap-2">
            {[4, 3, 2].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="rating" className="w-3.5 h-3.5 accent-orange-500" />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">& above</span>
                </div>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {config.show_discount_filter && (
        <FilterSection label="Discount">
          <div className="flex flex-col gap-1.5">
            {['10% or more', '25% or more', '50% or more'].map(d => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-orange-500" />
                <span className="text-xs text-slate-600">{d}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </aside>
  )
}

function FilterSection({ label, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-2">
      <button className="flex items-center justify-between" onClick={() => setOpen(o => !o)}>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && children}
    </div>
  )
}

// ─── Filter Top Bar ───────────────────────────────────────────────────────────

function FilterTopBar({ config, filters, onFiltersChange }) {
  const [openKey, setOpenKey] = useState(null)
  const [priceMin, setPriceMin] = useState(filters.price_min ?? '')
  const [priceMax, setPriceMax] = useState(filters.price_max ?? '')

  const active = [
    config.show_price_filter    && { key: 'price',    label: 'Price' },
    config.show_brand_filter    && { key: 'brand',    label: 'Brand' },
    config.show_rating_filter   && { key: 'rating',   label: 'Rating' },
    config.show_discount_filter && { key: 'discount', label: 'Discount' },
  ].filter(Boolean)

  if (!active.length) return null

  if (config.filter_style === 'chips') {
    return (
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
        {active.map(({ key, label }, i) => (
          <button key={key} className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${i === 0 ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{label}</button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 pb-4 border-b border-slate-200 flex-wrap relative">
      <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
      {active.map(({ key, label }) => (
        <div key={key} className="relative">
          <button
            onClick={() => setOpenKey(openKey === key ? null : key)}
            className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300 transition-colors"
          >
            {label} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {openKey === key && key === 'price' && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-20 w-52">
              <p className="text-xs font-semibold text-slate-600 mb-2">Price Range</p>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs w-0" />
                <span className="text-slate-300">–</span>
                <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs w-0" />
              </div>
              <button
                onClick={() => { onFiltersChange({ ...filters, price_min: priceMin || undefined, price_max: priceMax || undefined }); setOpenKey(null) }}
                className="w-full mt-2 bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
              >Apply</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ config, category, total }) {
  if (config.header_style === 'none' || !category) return null

  if (config.header_style === 'banner') {
    const hMap = { sm: 'py-8', md: 'py-14', lg: 'py-20' }
    return (
      <div className={`${hMap[config.banner_height] ?? 'py-8'} px-6`} style={{ backgroundColor: config.banner_bg_color }}>
        <div className="flex items-center gap-1.5 text-sm mb-2 opacity-60" style={{ color: config.banner_text_color }}>
          <Link to="/" className="hover:opacity-80" style={{ color: config.banner_text_color }}>Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{category.name}</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: config.banner_text_color }}>{category.name}</h1>
        {config.show_result_count && (
          <p className="text-sm mt-1 opacity-60" style={{ color: config.banner_text_color }}>{total} products</p>
        )}
      </div>
    )
  }

  if (config.header_style === 'breadcrumb-title') {
    return (
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Link to="/" className="hover:text-slate-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">{category.name}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">{category.name}</h1>
      </div>
    )
  }

  // breadcrumb only
  return (
    <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 font-medium">{category.name}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CmsProductListing({ category }) {
  const navigate = useNavigate()

  const [config,        setConfig]        = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [loginMode,     setLoginMode]     = useState('modal')
  const [showLoginModal, setShowLoginModal] = useState(false)

  const [products,     setProducts]     = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [sort,         setSort]         = useState(null)   // null until config loaded
  const [filters,      setFilters]      = useState({})
  const [loading,      setLoading]      = useState(false)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [sortOpen,          setSortOpen]          = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const loaderRef = useRef(null)
  const cfg = config ?? DEFAULT_CONFIG

  // ── Load CMS config ──
  useEffect(() => {
    getProductListingLayout().then(saved => {
      setConfig(saved)
      setSort(saved?.default_sort ?? DEFAULT_CONFIG.default_sort)
      setConfigLoading(false)
    })
    getLoginPageLayout().then(c => { if (c?.mode) setLoginMode(c.mode) }).catch(() => {})
  }, [])

  // ── Fetch products (initial / re-fetch on sort/filter change) ──
  useEffect(() => {
    if (!category?.id || configLoading || sort === null) return
    setLoading(true)
    productsApi
      .list({ category_id: category.id, page: 1, limit: cfg.products_per_page, sort: sort ?? cfg.default_sort, ...filters })
      .then(data => {
        setProducts(data.rows ?? [])
        setTotal(data.count ?? 0)
        setPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category?.id, configLoading, sort, filters])

  // ── Fetch a specific page (numbered pagination) ──
  const fetchPage = useCallback((p) => {
    if (!category?.id) return
    setPage(p)
    setLoading(true)
    productsApi
      .list({ category_id: category.id, page: p, limit: cfg.products_per_page, sort: sort ?? cfg.default_sort, ...filters })
      .then(data => {
        setProducts(data.rows ?? [])
        setTotal(data.count ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category?.id, cfg.products_per_page, sort, filters])

  // ── Load more (load-more button + infinite scroll) ──
  const loadMore = useCallback(() => {
    if (loadingMore || !category?.id) return
    const nextPage = page + 1
    setLoadingMore(true)
    productsApi
      .list({ category_id: category.id, page: nextPage, limit: cfg.products_per_page, sort: sort ?? cfg.default_sort, ...filters })
      .then(data => {
        setProducts(prev => [...prev, ...(data.rows ?? [])])
        setPage(nextPage)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [loadingMore, category?.id, page, cfg.products_per_page, sort, filters])

  // ── Infinite scroll observer ──
  useEffect(() => {
    if (cfg.pagination_style !== 'infinite-scroll') return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && !loadingMore && products.length < total) loadMore() },
      { threshold: 0.1 },
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [cfg.pagination_style, loadMore, loadingMore, products.length, total])

  function handleNeedLogin() {
    if (loginMode === 'modal') {
      setShowLoginModal(true)
    } else {
      navigate('/login')
    }
  }

  if (configLoading || !category) return null

  const hasSidebar     = cfg.filter_position === 'sidebar-left'
  const hasTopBar      = cfg.filter_position === 'top-bar'
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sort'
  const totalPages     = Math.ceil(total / cfg.products_per_page)
  const hasMore        = products.length < total

  return (
    <div>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}

      {/* Mobile filter bottom sheet */}
      {hasSidebar && mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <p className="font-semibold text-slate-800">Filters</p>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-5 py-4">
              <FilterSidebar
                config={cfg}
                filters={filters}
                onFiltersChange={f => { setFilters(f); setMobileFiltersOpen(false) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <PageHeader config={cfg} category={category} total={total} />

      <div className="px-3 py-4 sm:px-6 sm:py-6">
        {/* Toolbar: result count + sort */}
        {(cfg.show_result_count || cfg.show_sort) && (
          <div className="flex items-center justify-between mb-4 gap-2">
            {cfg.show_result_count && (
              <p className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''}`}
              </p>
            )}
            <div className="flex items-center gap-2 ml-auto">
            {/* Mobile filter trigger — only shown when sidebar mode is active */}
            {hasSidebar && (
              <button
                className="sm:hidden flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
            )}
            {cfg.show_sort && (
              <div className="relative">
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 hover:border-slate-300 transition-colors"
                >
                  {currentSortLabel} <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 w-44">
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setSort(o.value); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${sort === o.value ? 'text-orange-600 font-semibold bg-orange-50' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* Top-bar filters */}
        {hasTopBar && (
          <FilterTopBar config={cfg} filters={filters} onFiltersChange={f => { setFilters(f) }} />
        )}

        <div className={`flex gap-6 ${hasTopBar ? 'mt-4' : ''}`}>
          {/* Sidebar filters — hidden on mobile, visible sm+ */}
          {hasSidebar && (
            <div className="hidden sm:block">
              <FilterSidebar config={cfg} filters={filters} onFiltersChange={f => { setFilters(f) }} />
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <p className="text-slate-500 font-medium">No products found</p>
                <p className="text-slate-400 text-sm">Try adjusting your filters</p>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className={`grid gap-x-3 gap-y-4 sm:gap-4 ${GRID_COLS[cfg.grid_columns] ?? 'grid-cols-2 sm:grid-cols-4'}`}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} config={cfg} onNeedLogin={handleNeedLogin} />
                ))}
              </div>
            )}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="mt-8">
                {cfg.pagination_style === 'numbered' && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <button
                      disabled={page <= 1}
                      onClick={() => fetchPage(Math.max(1, page - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:border-slate-300 transition-colors"
                    >‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : (
                        page <= 3 ? i + 1 :
                        page >= totalPages - 2 ? totalPages - 4 + i :
                        page - 2 + i
                      )
                      return (
                        <button
                          key={p}
                          onClick={() => fetchPage(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${p === page ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >{p}</button>
                      )
                    })}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => fetchPage(Math.min(totalPages, page + 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:border-slate-300 transition-colors"
                    >›</button>
                  </div>
                )}

                {cfg.pagination_style === 'load-more' && hasMore && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                      Load More
                    </button>
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                {cfg.pagination_style === 'infinite-scroll' && hasMore && (
                  <div ref={loaderRef} className="h-10" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
