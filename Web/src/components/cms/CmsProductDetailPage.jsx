import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star, Heart, ChevronRight, Minus, Plus, ShoppingCart,
  Shield, RotateCcw, Truck, Share2, ChevronLeft, Loader2,
} from 'lucide-react'
import { productsApi, reviewsApi } from '../../lib/api'
import PageLoader from '../PageLoader'
import { getProductDetailLayout, getLoginPageLayout } from '../../lib/cmsCache'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { useWishlist } from '../../lib/wishlist'
import { LoginModal } from './CmsLoginPage'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const DEFAULT_CONFIG = {
  layout:               'default',
  image_aspect:         'square',
  show_breadcrumb:      true,
  show_category_badge:  true,
  show_ratings:         true,
  show_discount_badge:  true,
  show_short_description: true,
  show_qty_selector:    true,
  show_wishlist_btn:    true,
  cart_btn_label:       'Add to Cart',
  cart_btn_bg:          '#ffcc01',
  cart_btn_text_color:  '#1a1a1a',
  cart_btn_border_width: 0,
  cart_btn_border_color: '#ffcc01',
  show_buy_now_btn:     true,
  buy_now_label:        'Buy Now',
  buy_now_bg:           '#1e293b',
  buy_now_text_color:   '#ffffff',
  show_trust_badges:    true,
  show_return_policy:   true,
  show_description_tab: true,
  show_reviews_tab:     true,
  show_related_products: true,
  related_products_title: 'Related Products',
  related_count:        6,
}

function formatPrice(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`
}

function discountPct(sell, compareAt) {
  if (!compareAt || Number(compareAt) <= Number(sell)) return null
  return Math.round((compareAt - sell) / compareAt * 100)
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, variantId }) {
  const all = images ?? []
  // Filter to the selected variant's images; fall back to all if none match
  const forVariant = variantId != null
    ? all.filter(img => img.ProductMedia?.variant_id === variantId)
    : all
  const pool = forVariant.length > 0 ? forVariant : all

  const sorted = [...pool].sort((a, b) => {
    const aP = a.ProductMedia?.is_primary ? 0 : 1
    const bP = b.ProductMedia?.is_primary ? 0 : 1
    const aO = a.ProductMedia?.sort_order ?? 99
    const bO = b.ProductMedia?.sort_order ?? 99
    return aP - bP || aO - bO
  })

  const [active, setActive] = useState(0)

  if (!sorted.length) {
    return (
      <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center">
        <span className="text-slate-300 text-sm">No image</span>
      </div>
    )
  }

  const src = sorted[active]?.path ? `${MEDIA_BASE}${sorted[active].path}` : null

  const thumbnails = sorted.length > 1 && (
    sorted.map((img, i) => {
      const thumb = img.path ? `${MEDIA_BASE}${img.path}` : null
      return (
        <button
          key={img.id}
          onClick={() => setActive(i)}
          className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
            i === active ? 'border-orange-500' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {thumb
            ? <img src={thumb} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-slate-100" />
          }
        </button>
      )
    })
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Left thumbnail strip — hidden on mobile, shown on sm+ */}
      {sorted.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '480px' }}>
          {thumbnails}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-square bg-slate-100 rounded-2xl overflow-hidden">
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-slate-300 text-sm">No image</span></div>
        }
        {sorted.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => Math.max(0, i - 1))}
              disabled={active === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActive(i => Math.min(sorted.length - 1, i + 1))}
              disabled={active === sorted.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Bottom thumbnail strip — shown on mobile only */}
      {sorted.length > 1 && (
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-0.5">
          {thumbnails}
        </div>
      )}
    </div>
  )
}

// ─── Variant Picker ───────────────────────────────────────────────────────────

function buildAttributeMap(variants) {
  // Returns: { [attrName]: { attrId, values: [{ id, value, variantIds }] } }
  const map = {}
  for (const variant of variants) {
    for (const av of variant.attributeValues ?? []) {
      const name = av.attribute?.name
      if (!name) continue
      if (!map[name]) map[name] = { attrId: av.attribute.id, values: [] }
      const existing = map[name].values.find(v => v.id === av.id)
      if (existing) {
        existing.variantIds.push(variant.id)
      } else {
        map[name].values.push({ id: av.id, value: av.value, variantIds: [variant.id] })
      }
    }
  }
  return map
}

function resolveVariant(variants, selected) {
  // Find the variant whose attributeValues match all selected values
  return variants.find(v => {
    const ids = (v.attributeValues ?? []).map(av => av.id)
    return Object.values(selected).every(selId => ids.includes(selId))
  }) ?? null
}

function VariantPicker({ variants, selected, onSelect }) {
  if (!variants?.length) return null
  const attrMap = buildAttributeMap(variants)

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(attrMap).map(([attrName, { values }]) => (
        <div key={attrName} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-700">
            {attrName}:
            <span className="font-normal text-slate-500 ml-1">
              {values.find(v => v.id === selected[attrName])?.value ?? ''}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {values.map(v => {
              const isActive = selected[attrName] === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(attrName, v.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {v.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating = 4, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${cls} ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
    </div>
  )
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    reviewsApi.getByProduct(productId)
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>

  if (!reviews.length) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-center">
        <p className="text-slate-500 font-medium">No reviews yet</p>
        <p className="text-slate-400 text-sm">Be the first to review this product</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {reviews.map(r => (
        <div key={r.id} className="py-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
              {String(r.user_id).slice(-1)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Customer</p>
              <p className="text-xs text-slate-400">
                {r.created_ts ? new Date(r.created_ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{r.review}</p>
          {r.likes > 0 && (
            <p className="text-xs text-slate-400">{r.likes} people found this helpful</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Related Products ─────────────────────────────────────────────────────────

function RelatedProducts({ categoryId, parentCategoryId, excludeId, title = 'Related Products', count = 6 }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!categoryId) return

    // Fetch from the product's direct category (subcategory when applicable)
    productsApi.list({ category_id: categoryId, limit: count + 1 })
      .then(async data => {
        let rows = (data?.rows ?? []).filter(p => p.id !== excludeId).slice(0, count)

        // If the product is in a subcategory and we don't have enough results,
        // fill the remaining slots from the parent category
        if (rows.length < count && parentCategoryId && parentCategoryId !== categoryId) {
          const existing = new Set(rows.map(p => p.id))
          existing.add(excludeId)
          const need = count - rows.length
          const fallback = await productsApi.list({ category_id: parentCategoryId, limit: need + existing.size })
            .catch(() => null)
          const extra = (fallback?.rows ?? []).filter(p => !existing.has(p.id)).slice(0, need)
          rows = [...rows, ...extra]
        }

        setProducts(rows)
      })
      .catch(() => {})
  }, [categoryId, parentCategoryId, excludeId, count])

  if (!products.length) return null

  return (
    <section className="border-t border-slate-100 pt-10 mt-10">
      <h2 className="text-lg font-bold text-slate-800 mb-5">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map(p => {
          const price = p.prices?.[0]
          const sell = price ? (price.final_price ?? price.price) : null
          const compareAt = price?.compare_at_price ?? null
          const disc = discountPct(sell, compareAt)
          const img = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
          const imgSrc = img?.path ? `${MEDIA_BASE}${img.path}` : null

          return (
            <Link
              key={p.id}
              to={`/product/${p.slug ?? p.id}`}
              className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow no-underline"
            >
              <div className="relative aspect-square bg-slate-100">
                {imgSrc
                  ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-slate-300 text-xs">No image</span></div>
                }
                {disc && (
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{disc}%</span>
                )}
              </div>
              <div className="p-2.5 flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">{p.name}</p>
                {sell != null && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{formatPrice(sell)}</span>
                    {compareAt && Number(compareAt) > Number(sell) && (
                      <span className="text-xs text-slate-400 line-through">{formatPrice(compareAt)}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CmsProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { cartMap, addItem, decrementItem } = useCart()
  const { wishlistSet, toggleWishlist } = useWishlist()

  const [cfg,      setCfg]      = useState(DEFAULT_CONFIG)
  const [product,  setProduct]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selected,        setSelected]        = useState({})
  const [activeTab,       setActiveTab]       = useState('description')
  const [loginMode,       setLoginMode]       = useState('modal')
  const [showLoginModal,  setShowLoginModal]  = useState(false)
  const [busy,            setBusy]            = useState(false)
  const [wishBusy,        setWishBusy]        = useState(false)
  const reviewsRef = useRef(null)

  // Load CMS config once
  useEffect(() => {
    getProductDetailLayout().then(saved => {
      if (saved) setCfg({ ...DEFAULT_CONFIG, ...saved })
    })
    getLoginPageLayout().then(c => { if (c?.mode) setLoginMode(c.mode) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    window.scrollTo(0, 0)
    setLoading(true)
    setProduct(null)
    setNotFound(false)
    setSelected({})

    productsApi.getById(id)
      .then(data => {
        if (!data) { setNotFound(true); return }
        setProduct(data)
        const variants = data.variants ?? []
        if (variants.length) {
          const attrMap = buildAttributeMap(variants)
          const init = {}
          Object.entries(attrMap).forEach(([name, { values }]) => {
            if (values[0]) init[name] = values[0].id
          })
          setSelected(init)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-slate-500 font-medium text-lg">Product not found</p>
        <Link to="/" className="text-orange-500 text-sm hover:underline">Back to home</Link>
      </div>
    )
  }

  const qty = product ? (cartMap[product.id] ?? 0) : 0

  async function handleAdd() {
    if (!isAuthenticated) {
      localStorage.setItem('pendingCartItem', JSON.stringify({ productId: product.id, quantity: 1 }))
      if (loginMode === 'modal') setShowLoginModal(true)
      else navigate('/login')
      return
    }
    setBusy(true)
    try { await addItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleIncrement() {
    setBusy(true)
    try { await addItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleDecrement() {
    setBusy(true)
    try { await decrementItem(product.id) } catch {}
    setBusy(false)
  }

  async function handleWishlist() {
    if (!isAuthenticated) {
      localStorage.setItem('pendingWishlistItem', JSON.stringify({ productId: product.id }))
      if (loginMode === 'modal') setShowLoginModal(true)
      else navigate('/login')
      return
    }
    setWishBusy(true)
    try { await toggleWishlist(product.id) } catch {}
    setWishBusy(false)
  }

  async function handleBuyNow() {
    if (!isAuthenticated) {
      localStorage.setItem('pendingCartItem', JSON.stringify({ productId: product.id, quantity: 1 }))
      if (loginMode === 'modal') setShowLoginModal(true)
      else navigate('/login')
      return
    }
    setBusy(true)
    try {
      if (qty === 0) await addItem(product.id)
      navigate('/cart')
    } catch {}
    setBusy(false)
  }

  const hasVariants   = product.variants?.length > 0
  const activeVariant = hasVariants ? resolveVariant(product.variants, selected) : null
  const priceSource   = activeVariant?.prices?.[0] ?? product.prices?.[0]
  const sellPrice     = priceSource ? (priceSource.final_price ?? priceSource.price) : null
  const compareAt     = priceSource?.compare_at_price ?? null
  const discount      = discountPct(sellPrice, compareAt)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}

      {/* Breadcrumb */}
      {cfg.show_breadcrumb && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
          {product.Category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link to={`/category/${product.Category.slug}`} className="hover:text-slate-600 transition-colors">
                {product.Category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      )}

      {/* Main layout */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 ${cfg.layout === 'reverse' ? 'md:[&>*:first-child]:order-2' : ''}`}>

        {/* Gallery */}
        <div className={cfg.image_aspect === 'portrait' ? '[&_.aspect-square]:aspect-[3/4]' : ''}>
          <ImageGallery
            key={activeVariant?.id ?? 'default'}
            images={product.images}
            variantId={activeVariant?.id ?? null}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">

          {/* Category + share */}
          <div className="flex items-center justify-between">
            {cfg.show_category_badge && product.Category && (
              <Link
                to={`/category/${product.Category.slug}`}
                className="text-xs font-semibold text-orange-500 uppercase tracking-wide hover:text-orange-600 transition-colors"
              >
                {product.Category.name}
              </Link>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition-colors ml-auto">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-slate-900 leading-snug">{product.name}</h1>

          {/* Rating */}
          {cfg.show_ratings && (
            <div className="flex items-center gap-2">
              <Stars rating={4} size="md" />
              <span className="text-sm text-slate-500">
                4.0
                {cfg.show_reviews_tab && (
                  <button
                    onClick={() => { setActiveTab('reviews'); reviewsRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="ml-1 hover:underline"
                  >
                    (see reviews)
                  </button>
                )}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {sellPrice != null ? (
              <>
                <span className="text-3xl font-bold text-slate-900">{formatPrice(sellPrice)}</span>
                {compareAt && Number(compareAt) > Number(sellPrice) && (
                  <span className="text-lg text-slate-400 line-through">{formatPrice(compareAt)}</span>
                )}
                {cfg.show_discount_badge && discount && (
                  <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">{discount}% off</span>
                )}
              </>
            ) : (
              <span className="text-slate-400 text-sm">Price not available</span>
            )}
          </div>

          {/* Short description */}
          {cfg.show_short_description && product.short_description && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.short_description}</p>
          )}

          <div className="border-t border-slate-100" />

          {/* Variants */}
          {hasVariants && (
            <VariantPicker
              variants={product.variants}
              selected={selected}
              onSelect={(attrName, valueId) => setSelected(prev => ({ ...prev, [attrName]: valueId }))}
            />
          )}

          {/* Qty + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {qty > 0 ? (
              <div className="w-[140px] flex items-center rounded-lg overflow-hidden border border-slate-800 bg-white text-slate-800">
                <button
                  onClick={handleDecrement}
                  disabled={busy}
                  className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity text-base font-bold disabled:opacity-50"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={handleIncrement}
                  disabled={busy}
                  className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity text-base font-bold disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={busy}
                className="w-[140px] h-10 font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 text-sm disabled:opacity-60"
                style={{
                  backgroundColor: cfg.cart_btn_bg,
                  color: cfg.cart_btn_text_color,
                  border: cfg.cart_btn_border_width > 0 ? `${cfg.cart_btn_border_width}px solid ${cfg.cart_btn_border_color}` : 'none',
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                {busy ? '...' : cfg.cart_btn_label}
              </button>
            )}

            {cfg.show_buy_now_btn && (
              <button
                onClick={handleBuyNow}
                disabled={busy}
                className="w-[140px] h-10 font-semibold rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 text-sm disabled:opacity-60"
                style={{ backgroundColor: cfg.buy_now_bg, color: cfg.buy_now_text_color }}
              >
                {cfg.buy_now_label}
              </button>
            )}

            {cfg.show_wishlist_btn && (
              <button
                onClick={handleWishlist}
                disabled={wishBusy}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
                  wishlistSet.has(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlistSet.has(product.id) ? 'fill-red-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Trust badges */}
          {cfg.show_trust_badges && (
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { icon: Truck,     label: 'Free Delivery',  sub: 'On orders above ₹499' },
                { icon: Shield,    label: 'Secure Payment', sub: '100% safe & secure' },
                { icon: RotateCcw, label: 'Easy Returns',   sub: cfg.show_return_policy && product.return_allowed ? `${product.return_timeline ?? 7} day returns` : 'No returns' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 border border-slate-100 rounded-xl p-3 text-center">
                  <Icon className="w-5 h-5 text-orange-500" />
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {(cfg.show_description_tab || cfg.show_reviews_tab) && (
        <div ref={reviewsRef} className="mt-12 border-t border-slate-100 pt-8">
          <div className="flex border-b border-slate-200 mb-6">
            {[
              cfg.show_description_tab && { key: 'description', label: 'Description' },
              cfg.show_reviews_tab     && { key: 'reviews',     label: 'Reviews' },
            ].filter(Boolean).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && cfg.show_description_tab && (
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
              {product.description
                ? product.description.split('\n').map((line, i) => <p key={i}>{line}</p>)
                : <p className="text-slate-400">No description available.</p>
              }
            </div>
          )}

          {activeTab === 'reviews' && cfg.show_reviews_tab && (
            <ReviewsSection productId={product.id} />
          )}
        </div>
      )}

      {/* Related products */}
      {cfg.show_related_products && (
        <RelatedProducts
          categoryId={product.category_id}
          parentCategoryId={product.Category?.parent_id ?? null}
          excludeId={product.id}
          title={cfg.related_products_title}
          count={cfg.related_count}
        />
      )}
    </div>
  )
}
