import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, Tag, ChevronLeft, Loader2 } from 'lucide-react'
import { getCartPageLayout } from '../../lib/cmsCache'
import PageLoader from '../PageLoader'
import { cartApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const RADIUS_CLS = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded', lg: 'rounded-lg', xl: 'rounded-xl' }

const DEFAULT_CONFIG = {
  layout:            'split',
  show_page_title:   true,
  page_title:        'My Cart',
  show_item_image:   true,
  show_item_sku:     false,
  show_item_variant: true,
  show_qty_selector: true,
  show_remove_btn:   true,
  show_line_total:   true,
  show_coupon_field:     true,
  coupon_placeholder:    'Enter coupon code',
  show_subtotal:         true,
  show_shipping_row:     true,
  shipping_label:        'Shipping',
  show_tax_row:          true,
  tax_label:             'GST',
  show_discount_row:     true,
  apply_btn_bg:           '#1e293b',
  apply_btn_text_color:   '#ffffff',
  apply_btn_border_width: 0,
  apply_btn_border_color: '#1e293b',
  apply_btn_radius:       'md',
  checkout_btn_label:        'Proceed to Checkout',
  checkout_btn_bg:           '#ffcc01',
  checkout_btn_text_color:   '#1a1a1a',
  checkout_btn_border_width: 0,
  checkout_btn_border_color: '#ffcc01',
  checkout_btn_radius:       'lg',
  show_continue_shopping:    true,
  continue_shopping_label:   'Continue Shopping',
  show_empty_illustration:   true,
  empty_title:               'Your cart is empty',
  empty_subtitle:            "Looks like you haven't added anything yet.",
  empty_cta_label:           'Shop Now',
  empty_cta_bg:              '#ffcc01',
  empty_cta_text_color:      '#1a1a1a',
}

function formatPrice(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyCart({ cfg }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      {cfg.show_empty_illustration && (
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-slate-300" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-slate-800">{cfg.empty_title}</p>
        {cfg.empty_subtitle && (
          <p className="text-sm text-slate-400">{cfg.empty_subtitle}</p>
        )}
      </div>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-lg text-sm font-semibold no-underline"
        style={{ backgroundColor: cfg.empty_cta_bg, color: cfg.empty_cta_text_color }}
      >
        {cfg.empty_cta_label}
      </Link>
    </div>
  )
}

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItem({ item, cfg, onIncrement, onDecrement, onRemove }) {
  const [busy, setBusy] = useState(false)
  const product   = item.Product ?? {}
  const price     = product.prices?.[0]
  const unitPrice = price ? Number(price.final_price ?? price.price) : 0
  const image     = product.images?.find(i => i.ProductMedia?.is_primary) ?? product.images?.[0]
  const imgSrc    = image?.path ? `${MEDIA_BASE}${image.path}` : null
  const maxCart   = (product.max_cart != null && product.max_cart > 0) ? product.max_cart : null
  const atMax     = maxCart !== null && item.quantity >= maxCart

  async function handle(fn) {
    setBusy(true)
    try { await fn() } catch {}
    setBusy(false)
  }

  return (
    <div className="flex gap-3 border border-slate-200 rounded-xl p-3">
      {cfg.show_item_image && (
        <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0">
          {imgSrc
            ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-slate-300" /></div>
          }
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Link
          to={`/product/${product.slug ?? product.id}`}
          className="text-sm font-semibold text-slate-800 leading-tight hover:text-orange-500 transition-colors no-underline line-clamp-2"
        >
          {product.name}
        </Link>
        {cfg.show_item_sku && product.product_code && (
          <p className="text-xs text-slate-400 font-mono">{product.product_code}</p>
        )}
        <p className="text-sm font-bold text-slate-700">{formatPrice(unitPrice)}</p>
      </div>

      <div className="flex flex-col items-end justify-between shrink-0 gap-2">
        {cfg.show_remove_btn && (
          <button
            disabled={busy}
            onClick={() => handle(onRemove)}
            className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {cfg.show_qty_selector && (
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              disabled={busy}
              onClick={() => handle(onDecrement)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors text-sm font-bold"
            >−</button>
            <span className="min-w-[2rem] h-8 flex items-center justify-center text-sm font-semibold border-x border-slate-200 px-1">
              {item.quantity}{atMax ? ` / ${maxCart}` : ''}
            </span>
            <button
              disabled={busy || atMax}
              onClick={() => handle(onIncrement)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors text-sm font-bold"
            >+</button>
          </div>
        )}

        {cfg.show_line_total && (
          <p className="text-sm font-bold text-slate-800">{formatPrice(unitPrice * item.quantity)}</p>
        )}
      </div>
    </div>
  )
}

// ─── Order Summary ─────────────────────────────────────────────────────────────

function OrderSummary({ cfg, items, coupon, setCoupon, onCheckout }) {
  const subtotal = items.reduce((sum, item) => {
    const price = item.Product?.prices?.[0]
    const unit  = price ? Number(price.final_price ?? price.price) : 0
    return sum + unit * item.quantity
  }, 0)

  const checkoutStyle = {
    backgroundColor: cfg.checkout_btn_bg,
    color: cfg.checkout_btn_text_color,
    border: cfg.checkout_btn_border_width > 0
      ? `${cfg.checkout_btn_border_width}px solid ${cfg.checkout_btn_border_color}`
      : 'none',
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4 h-fit sm:sticky sm:top-4">
      <p className="text-base font-bold text-slate-800">Order Summary</p>

      {cfg.show_coupon_field && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-2">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder={cfg.coupon_placeholder}
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400 min-w-0"
            />
          </div>
          <button
            className={`w-full py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${RADIUS_CLS[cfg.apply_btn_radius] ?? 'rounded'}`}
            style={{
              backgroundColor: cfg.apply_btn_bg,
              color: cfg.apply_btn_text_color,
              border: cfg.apply_btn_border_width > 0
                ? `${cfg.apply_btn_border_width}px solid ${cfg.apply_btn_border_color}`
                : 'none',
            }}
          >
            Apply
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        {cfg.show_subtotal && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-700">{formatPrice(subtotal)}</span>
          </div>
        )}
        {cfg.show_discount_row && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="font-semibold text-green-600">−₹0</span>
          </div>
        )}
        {cfg.show_shipping_row && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{cfg.shipping_label}</span>
            <span className="font-semibold text-slate-700">Free</span>
          </div>
        )}
        {cfg.show_tax_row && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{cfg.tax_label}</span>
            <span className="font-semibold text-slate-700">Included</span>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t border-slate-200 pt-3">
        <span className="font-bold text-slate-800">Total</span>
        <span className="font-bold text-slate-800 text-lg">{formatPrice(subtotal)}</span>
      </div>

      <button
        onClick={onCheckout}
        className={`w-full py-3 text-sm font-bold transition-opacity hover:opacity-90 ${RADIUS_CLS[cfg.checkout_btn_radius] ?? 'rounded-lg'}`}
        style={checkoutStyle}
      >
        {cfg.checkout_btn_label}
      </button>

      {cfg.show_continue_shopping && (
        <Link
          to="/"
          className="flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors no-underline"
        >
          <ChevronLeft className="w-4 h-4" />
          {cfg.continue_shopping_label}
        </Link>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CmsCartPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { cartMap, addItem, decrementItem, removeItem, loadCart } = useCart()

  const [cfg,     setCfg]     = useState(null)
  const [items,   setItems]   = useState([])       // full cart rows from API (for product details)
  const [loading, setLoading] = useState(true)
  const [coupon,  setCoupon]  = useState('')

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  // Load CMS config + cart items
  useEffect(() => {
    if (!isAuthenticated) return
    Promise.all([
      getCartPageLayout(),
      cartApi.get(),
    ]).then(([config, data]) => {
      setCfg(config)
      setItems(Array.isArray(data) ? data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  // Keep items list in sync with cartMap (remove entries dropped to 0)
  useEffect(() => {
    setItems(prev => prev.filter(item => (cartMap[item.product_id] ?? 0) > 0))
  }, [cartMap])

  const config = cfg ?? DEFAULT_CONFIG

  // Merge cartMap quantities into items (source of truth for qty is context)
  const displayItems = items.map(item => ({
    ...item,
    quantity: cartMap[item.product_id] ?? item.quantity,
  }))

  if (loading) return <PageLoader />

  if (displayItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-8">
        {config.show_page_title && (
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">{config.page_title}</h1>
        )}
        <EmptyCart cfg={config} />
      </div>
    )
  }

  const isStacked = config.layout === 'stacked'

  return (
    <div className="max-w-7xl mx-auto px-3 py-6 sm:px-6 sm:py-8">
      {config.show_page_title && (
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">{config.page_title}</h1>
      )}

      {/* Always stack on mobile; use config layout on sm+ */}
      <div className={`flex flex-col gap-4 sm:gap-6 ${!isStacked ? 'sm:flex-row sm:items-start' : ''}`}>
        {/* Items list */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {displayItems.map(item => (
            <CartItem
              key={item.product_id}
              item={item}
              cfg={config}
              onIncrement={() => addItem(item.product_id)}
              onDecrement={() => decrementItem(item.product_id)}
              onRemove={() => removeItem(item.product_id)}
            />
          ))}
        </div>

        {/* Order summary — full width on mobile, fixed 320px on desktop split */}
        <div className={!isStacked ? 'sm:w-80 sm:shrink-0' : ''}>
          <OrderSummary
            cfg={config}
            items={displayItems}
            coupon={coupon}
            setCoupon={setCoupon}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </div>
  )
}
