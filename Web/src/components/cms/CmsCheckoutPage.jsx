import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, ShoppingBag, Tag, Lock, Truck, Zap, Package,
  CreditCard, Smartphone, Building2, Wallet, MapPin, Plus, X, Check,
} from 'lucide-react'
import { getCheckoutPageLayout } from '../../lib/cmsCache'
import PageLoader from '../PageLoader'
import { cartApi, addressApi, locationsApi, paymentsApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const RADIUS_CLS = {
  none: 'rounded-none', sm: 'rounded-sm', md: 'rounded', lg: 'rounded-lg', xl: 'rounded-xl',
}

const DEFAULT_CONFIG = {
  layout:             'split',
  show_page_title:    true,
  page_title:         'Checkout',

  show_stepper:       true,
  stepper_style:      'numbered',
  stepper_steps:      'Cart,Shipping,Payment,Review',

  show_contact:       true,
  contact_title:      'Contact',
  show_shipping:      true,
  shipping_title:     'Shipping Address',
  show_delivery:      true,
  delivery_title:     'Delivery Method',
  show_payment:       true,
  payment_title:      'Payment',

  show_free_shipping: true,
  show_express:       true,
  show_cod:           true,

  show_upi:           true,
  show_card:          true,
  show_netbanking:    true,
  show_wallet:        false,

  show_summary:           true,
  summary_title:          'Order Summary',
  show_summary_image:     true,
  show_summary_subtotal:  true,
  show_summary_shipping:  true,
  show_summary_tax:       true,
  show_summary_discount:  true,
  show_coupon_field:      false,
  coupon_placeholder:     'Enter coupon code',

  place_order_label:        'Place Order',
  place_order_bg:           '#ffcc01',
  place_order_text_color:   '#1a1a1a',
  place_order_border_width: 0,
  place_order_border_color: '#ffcc01',
  place_order_radius:       'lg',

  show_security_note: true,
  security_note:      'Your payment info is encrypted and secure.',
}

function formatPrice(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ cfg, activeStep }) {
  if (!cfg.show_stepper) return null
  const steps = cfg.stepper_steps.split(',').map(s => s.trim()).filter(Boolean)

  if (cfg.stepper_style === 'dots') {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= activeStep ? 'bg-yellow-400' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  if (cfg.stepper_style === 'pills') {
    return (
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {steps.map((label, i) => (
          <span
            key={i}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              i === activeStep
                ? 'bg-yellow-400 text-gray-900'
                : i < activeStep
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    )
  }

  // numbered (default)
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < activeStep
                ? 'bg-yellow-400 text-gray-900'
                : i === activeStep
                  ? 'bg-yellow-400 text-gray-900 ring-4 ring-yellow-100'
                  : 'bg-slate-100 text-slate-400'
            }`}>
              {i < activeStep ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${
              i <= activeStep ? 'text-slate-700' : 'text-slate-400'
            }`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 mb-5 mx-1 transition-colors ${
              i < activeStep ? 'bg-yellow-400' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Field({ label, type = 'text', placeholder, value, onChange, required, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}{required && ' *'}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`border rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 transition ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-50'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Delivery options ─────────────────────────────────────────────────────────

const DELIVERY_OPTIONS = [
  { key: 'free',    label: 'Standard Shipping',  sub: '5–7 business days', price: 'Free',   icon: Truck,   cfg: 'show_free_shipping' },
  { key: 'express', label: 'Express Shipping',   sub: '1–2 business days', price: '₹149',   icon: Zap,     cfg: 'show_express'       },
  { key: 'cod',     label: 'Cash on Delivery',   sub: '5–7 business days', price: '₹25',    icon: Package, cfg: 'show_cod'           },
]

function DeliverySection({ cfg, selected, onSelect }) {
  if (!cfg.show_delivery) return null
  const options = DELIVERY_OPTIONS.filter(o => cfg[o.cfg])
  if (!options.length) return null
  return (
    <Section title={cfg.delivery_title}>
      <div className="flex flex-col gap-2">
        {options.map(({ key, label, sub, price, icon: Icon }) => (
          <label
            key={key}
            className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
              selected === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value={key}
              checked={selected === key}
              onChange={() => onSelect(key)}
              className="accent-blue-500"
            />
            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
            <span className="text-sm font-bold text-slate-700 shrink-0">{price}</span>
          </label>
        ))}
      </div>
    </Section>
  )
}

// ─── Payment options ──────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { key: 'upi',        label: 'UPI',         sub: 'GPay, PhonePe, Paytm', icon: Smartphone, cfg: 'show_upi'        },
  { key: 'card',       label: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard, cfg: 'show_card'       },
  { key: 'netbanking', label: 'Net Banking',  sub: 'All major banks',      icon: Building2,  cfg: 'show_netbanking' },
  { key: 'wallet',     label: 'Wallet',       sub: 'Paytm, Amazon Pay',   icon: Wallet,     cfg: 'show_wallet'     },
]

function PaymentSection({ cfg, selected, onSelect }) {
  if (!cfg.show_payment) return null
  const options = PAYMENT_OPTIONS.filter(o => cfg[o.cfg])
  if (!options.length) return null
  return (
    <Section title={cfg.payment_title}>
      <div className="flex flex-col gap-2">
        {options.map(({ key, label, sub, icon: Icon }) => (
          <label
            key={key}
            className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
              selected === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={key}
              checked={selected === key}
              onChange={() => onSelect(key)}
              className="accent-blue-500"
            />
            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          </label>
        ))}
      </div>
      {selected === 'upi' && (
        <div className="mt-1">
          <Field label="UPI ID" placeholder="yourname@upi" value="" onChange={() => {}} />
        </div>
      )}
      {selected === 'card' && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <Lock className="w-3 h-3 shrink-0" />
          You'll enter your card details securely on the next step.
        </p>
      )}
    </Section>
  )
}

// ─── Order summary panel ──────────────────────────────────────────────────────

function OrderSummaryPanel({ cfg, items, coupon, setCoupon, onPlaceOrder, placing }) {
  const subtotal = items.reduce((sum, item) => {
    const price = item.Product?.prices?.[0]
    const unit  = price ? Number(price.final_price ?? price.price) : 0
    return sum + unit * item.quantity
  }, 0)

  const btnStyle = {
    backgroundColor: cfg.place_order_bg,
    color: cfg.place_order_text_color,
    border: cfg.place_order_border_width > 0
      ? `${cfg.place_order_border_width}px solid ${cfg.place_order_border_color}`
      : 'none',
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4 h-fit sm:sticky sm:top-4">
      <p className="text-base font-bold text-slate-800">{cfg.summary_title}</p>

      {/* Items */}
      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
        {items.map(item => {
          const product = item.Product ?? {}
          const price   = product.prices?.[0]
          const unit    = price ? Number(price.final_price ?? price.price) : 0
          const image   = product.images?.find(i => i.ProductMedia?.is_primary) ?? product.images?.[0]
          const imgSrc  = image?.path ? `${MEDIA_BASE}${image.path}` : null

          return (
            <div key={item.product_id} className="flex items-center gap-3">
              {cfg.show_summary_image && (
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {imgSrc
                    ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-slate-300" /></div>
                  }
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 line-clamp-1">{product.name}</p>
                <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
              </div>
              <span className="text-xs font-bold text-slate-700 shrink-0">{formatPrice(unit * item.quantity)}</span>
            </div>
          )
        })}
      </div>

      {/* Coupon */}
      {cfg.show_coupon_field && (
        <div className="flex gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-2 items-center">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={coupon}
            onChange={e => setCoupon(e.target.value)}
            placeholder={cfg.coupon_placeholder}
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400 min-w-0"
          />
          <button className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 shrink-0">Apply</button>
        </div>
      )}

      {/* Totals */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        {cfg.show_summary_subtotal && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-700">{formatPrice(subtotal)}</span>
          </div>
        )}
        {cfg.show_summary_discount && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="font-semibold text-green-600">−₹0</span>
          </div>
        )}
        {cfg.show_summary_shipping && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Shipping</span>
            <span className="font-semibold text-slate-700">Free</span>
          </div>
        )}
        {cfg.show_summary_tax && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span className="font-semibold text-slate-700">Included</span>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t border-slate-200 pt-3">
        <span className="font-bold text-slate-800">Total</span>
        <span className="font-bold text-slate-800 text-lg">{formatPrice(subtotal)}</span>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={placing}
        className={`w-full py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 ${RADIUS_CLS[cfg.place_order_radius] ?? 'rounded-lg'}`}
        style={btnStyle}
      >
        {placing && <Loader2 className="w-4 h-4 animate-spin" />}
        {cfg.place_order_label}
      </button>

      {cfg.show_security_note && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
          <Lock className="w-3 h-3 shrink-0" />
          {cfg.security_note}
        </p>
      )}
    </div>
  )
}

// ─── Add Address Form ─────────────────────────────────────────────────────────

function AddAddressForm({ onSaved, onCancel }) {
  const [form, setForm]       = useState({ address1: '', address2: '', pincode: '' })
  const [states, setStates]   = useState([])
  const [cities, setCities]   = useState([])
  const [stateId, setStateId] = useState('')
  const [cityId,  setCityId]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    locationsApi.states().then(setStates).catch(() => {})
  }, [])

  useEffect(() => {
    if (!stateId) { setCities([]); setCityId(''); return }
    locationsApi.cities(stateId).then(setCities).catch(() => {})
    setCityId('')
  }, [stateId])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.address1 || !stateId || !cityId || !form.pincode) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    try {
      const saved = await addressApi.create({
        address1: form.address1,
        address2: form.address2 || undefined,
        state_id: Number(stateId),
        city_id:  Number(cityId),
        pincode:  form.pincode,
      })
      onSaved(saved)
    } catch (err) {
      setError(err.message || 'Failed to save address.')
    } finally {
      setSaving(false)
    }
  }

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3 border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
      <p className="text-sm font-semibold text-slate-700">New Address</p>

      <Field label="Address Line 1" placeholder="House / Flat / Building" required value={form.address1} onChange={set('address1')} />
      <Field label="Address Line 2" placeholder="Street / Area (optional)" value={form.address2} onChange={set('address2')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* State select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">State *</label>
          <select
            value={stateId}
            onChange={e => setStateId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white"
          >
            <option value="">Select state</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* City select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">City *</label>
          <select
            value={cityId}
            onChange={e => setCityId(e.target.value)}
            disabled={!stateId}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white disabled:opacity-50"
          >
            <option value="">Select city</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <Field label="Pincode" placeholder="400001" required value={form.pincode} onChange={set('pincode')} />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Address
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Shipping section (saved addresses) ───────────────────────────────────────

function ShippingSection({ cfg, addresses, selectedId, onSelect, onAddressAdded, error }) {
  if (!cfg.show_shipping) return null
  const [showForm, setShowForm] = useState(false)

  function handleSaved(newAddr) {
    onAddressAdded(newAddr)
    setShowForm(false)
  }

  return (
    <Section title={cfg.shipping_title}>
      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-slate-400">No saved addresses yet.</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex flex-col gap-2">
        {addresses.map(addr => (
          <label
            key={addr.id}
            className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
              selectedId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="address"
              value={addr.id}
              checked={selectedId === addr.id}
              onChange={() => onSelect(addr.id)}
              className="accent-blue-500 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{addr.address1}</p>
              {addr.address2 && <p className="text-xs text-slate-500">{addr.address2}</p>}
              <p className="text-xs text-slate-500">
                {addr.City?.name}{addr.City ? ', ' : ''}{addr.State?.name} — {addr.pincode}
              </p>
            </div>
            {selectedId === addr.id && <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
          </label>
        ))}
      </div>

      {showForm
        ? <AddAddressForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-semibold text-yellow-700 hover:text-yellow-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add new address
          </button>
        )
      }
    </Section>
  )
}

// ─── Gateway Selection Modal ──────────────────────────────────────────────────

const GATEWAYS = [
  {
    key:   'stripe',
    label: 'Stripe',
    desc:  'Pay securely with Stripe — Visa, Mastercard, RuPay',
    logo:  (
      <svg viewBox="0 0 60 25" className="h-6" fill="none">
        <path d="M59.64 14.28c0-4.64-2.24-8.3-6.52-8.3-4.3 0-6.9 3.66-6.9 8.27 0 5.46 3.08 8.22 7.5 8.22 2.15 0 3.78-.49 5.01-1.18v-3.6c-1.23.62-2.64.97-4.43.97-1.75 0-3.31-.62-3.51-2.76h8.85v-1.62zm-8.95-1.72c0-2.05 1.25-2.9 2.4-2.9 1.11 0 2.29.85 2.29 2.9h-4.69zM40.96 5.98c-1.76 0-2.89.82-3.52 1.4l-.23-1.11H33.8v21.3l3.82-.81.01-5.17c.65.47 1.6 1.14 3.18 1.14 3.21 0 6.14-2.58 6.14-8.28-.01-5.21-2.97-8.47-6-8.47zm-1.05 13.04c-1.06 0-1.68-.38-2.11-.85l-.02-6.7c.46-.52 1.1-.88 2.13-.88 1.63 0 2.76 1.83 2.76 4.2 0 2.42-1.11 4.23-2.76 4.23zM28.24 4.6l3.83-.82V0l-3.83.81V4.6zM28.24 6.27h3.83V22.1h-3.83V6.27zM24.56 7.39l-.24-1.12h-3.32V22.1h3.82v-10.7c.9-1.18 2.44-.96 2.92-.79V6.27c-.5-.18-2.32-.52-3.18 1.12zM16.67 3.01l-3.73.79-.02 12.21c0 2.25 1.69 3.91 3.94 3.91 1.25 0 2.16-.23 2.66-.5v-3.1c-.49.2-2.9.9-2.9-1.35V9.58h2.9V6.27h-2.9l.05-3.26zM4.25 10.23c0-.6.49-.83 1.3-.83 1.16 0 2.63.35 3.79 .97V6.8C8.16 6.24 6.99 6 5.55 6 2.22 6 0 7.74 0 10.37c0 4.06 5.59 3.41 5.59 5.16 0 .71-.62.94-1.48.94-1.28 0-2.92-.53-4.21-1.23v3.62C1.16 19.5 2.61 20 4.07 20c3.41 0 5.75-1.68 5.75-4.35-.01-4.38-5.57-3.6-5.57-5.42z" fill="#635BFF"/>
      </svg>
    ),
  },
  {
    key:   'razorpay',
    label: 'Razorpay',
    desc:  'UPI, Cards, Net Banking, Wallets — all in one',
    logo:  (
      <svg viewBox="0 0 130 30" className="h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.2 0L8.4 17.5l4.2 1.4L5 30l17.5-19.6-4.9-1.4L21.2 0z" fill="#2EB6E8"/>
        <path d="M14.7 9l-4.9 1.4L22.4 30l-2.8-12.5-5 2.1L14.7 9z" fill="#072654"/>
        <text x="32" y="22" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="#072654">razorpay</text>
      </svg>
    ),
  },
]

// ─── Razorpay helpers ─────────────────────────────────────────────────────────

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

async function openRazorpay({ orderId, razorpayOrderId, amount, keyId }, navigate, setPlaceError) {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    setPlaceError('Could not load Razorpay. Please check your connection.')
    return
  }
  return new Promise(resolve => {
    const rzp = new window.Razorpay({
      key:         keyId,
      amount,
      currency:    'INR',
      order_id:    razorpayOrderId,
      name:        'Groco',
      description: `Order #${orderId}`,
      theme:       { color: '#1e293b' },
      handler: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
        try {
          await paymentsApi.razorpayVerify({ orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature })
          navigate('/account?tab=orders')
        } catch (err) {
          setPlaceError(err.message || 'Payment verification failed. Please contact support.')
        }
        resolve()
      },
      modal: { ondismiss: resolve },
    })
    rzp.open()
  })
}

function GatewayModal({ onProceed, onClose, loading }) {
  const [selected, setSelected] = useState('stripe')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-800">Select Payment Gateway</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {GATEWAYS.map(gw => (
            <label
              key={gw.key}
              className={`flex items-center gap-4 border rounded-xl p-4 cursor-pointer transition-colors ${
                selected === gw.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="gateway"
                value={gw.key}
                checked={selected === gw.key}
                onChange={() => setSelected(gw.key)}
                className="accent-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="mb-1">{gw.logo}</div>
                <p className="text-xs text-slate-500">{gw.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onProceed(selected)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Proceed
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CmsCheckoutPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { cartMap } = useCart()

  const [cfg,            setCfg]            = useState(null)
  const [items,          setItems]          = useState([])
  const [addresses,      setAddresses]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [placing,        setPlacing]        = useState(false)
  const [coupon,         setCoupon]         = useState('')
  const [errors,         setErrors]         = useState({})
  const [showGateway,    setShowGateway]    = useState(false)
  const [placeError,     setPlaceError]     = useState('')

  // Form state
  const [contact,    setContact]    = useState({ name: '', email: '', phone: '' })
  const [addressId,  setAddressId]  = useState(null)
  const [delivery,   setDelivery]   = useState('free')
  const [payment,    setPayment]    = useState('upi')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return }
    Promise.all([
      getCheckoutPageLayout(),
      cartApi.get(),
      addressApi.get(),
    ]).then(([config, cartData, addrData]) => {
      setCfg(config)
      setItems(Array.isArray(cartData) ? cartData : [])
      const addrs = Array.isArray(addrData) ? addrData : []
      setAddresses(addrs)
      if (addrs.length > 0) setAddressId(addrs[0].id)

      if (config) {
        const firstDelivery = ['show_free_shipping', 'show_express', 'show_cod'].find(k => config[k])
        if (firstDelivery) setDelivery({ show_free_shipping: 'free', show_express: 'express', show_cod: 'cod' }[firstDelivery])

        const firstPayment = ['show_upi', 'show_card', 'show_netbanking', 'show_wallet'].find(k => config[k])
        if (firstPayment) setPayment({ show_upi: 'upi', show_card: 'card', show_netbanking: 'netbanking', show_wallet: 'wallet' }[firstPayment])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated, navigate])

  useEffect(() => {
    setItems(prev => prev.filter(item => (cartMap[item.product_id] ?? 0) > 0))
  }, [cartMap])

  function handleAddressAdded(newAddr) {
    setAddresses(prev => [newAddr, ...prev])
    setAddressId(newAddr.id)
  }

  const config = cfg ?? DEFAULT_CONFIG

  const displayItems = items.map(item => ({
    ...item,
    quantity: cartMap[item.product_id] ?? item.quantity,
  }))

  function validate() {
    const errs = {}
    if (config.show_contact) {
      if (!contact.name.trim())  errs.name  = 'Full name is required.'
      if (!contact.email.trim()) errs.email = 'Email is required.'
      if (!contact.phone.trim()) errs.phone = 'Phone number is required.'
    }
    if (config.show_shipping && !addressId) {
      errs.address = 'Please select a delivery address.'
    }
    return errs
  }

  function handlePlaceOrder() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setPlaceError('')

    if (payment === 'card') {
      // Show gateway selection modal
      setShowGateway(true)
    } else {
      // COD / UPI / other — placeholder for future flow
      navigate('/payment', { state: { method: payment } })
    }
  }

  async function handleGatewayProceed(gatewayKey) {
    setPlacing(true)
    setShowGateway(false)
    try {
      if (gatewayKey === 'stripe') {
        const result = await paymentsApi.createIntent({ addressId })
        navigate('/payment', { state: { clientSecret: result.clientSecret, orderId: result.orderId } })
      } else if (gatewayKey === 'razorpay') {
        const result = await paymentsApi.razorpayCreate({ addressId })
        await openRazorpay(result, navigate, setPlaceError)
      }
    } catch (err) {
      setPlaceError(err.message || 'Failed to initiate payment. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <PageLoader />

  if (displayItems.length === 0) {
    navigate('/cart', { replace: true })
    return null
  }

  const isStacked = config.layout === 'stacked'

  const formPanel = (
    <div className="flex flex-col gap-4">
      {/* Contact */}
      {config.show_contact && (
        <Section title={config.contact_title}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label="Full Name" placeholder="John Doe" required value={contact.name} onChange={e => { setContact(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }} error={errors.name} />
            </div>
            <Field label="Email" type="email" placeholder="you@example.com" required value={contact.email} onChange={e => { setContact(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} error={errors.email} />
            <Field label="Phone" type="tel" placeholder="+91 99999 99999" required value={contact.phone} onChange={e => { setContact(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })) }} error={errors.phone} />
          </div>
        </Section>
      )}

      {/* Shipping — saved addresses */}
      <ShippingSection
        cfg={config}
        addresses={addresses}
        selectedId={addressId}
        onSelect={(id) => { setAddressId(id); setErrors(p => ({ ...p, address: '' })) }}
        onAddressAdded={handleAddressAdded}
        error={errors.address}
      />

      {/* Delivery */}
      <DeliverySection cfg={config} selected={delivery} onSelect={setDelivery} />

      {/* Payment */}
      <PaymentSection cfg={config} selected={payment} onSelect={setPayment} />

      {/* Place order button (stacked layout) */}
      {isStacked && config.show_summary && (
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className={`w-full py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 ${RADIUS_CLS[config.place_order_radius] ?? 'rounded-lg'}`}
          style={{
            backgroundColor: config.place_order_bg,
            color: config.place_order_text_color,
            border: config.place_order_border_width > 0
              ? `${config.place_order_border_width}px solid ${config.place_order_border_color}`
              : 'none',
          }}
        >
          {placing && <Loader2 className="w-4 h-4 animate-spin" />}
          {config.place_order_label}
        </button>
      )}
    </div>
  )

  return (
    <>
    {showGateway && (
      <GatewayModal
        onProceed={handleGatewayProceed}
        onClose={() => setShowGateway(false)}
        loading={placing}
      />
    )}
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {config.show_page_title && (
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{config.page_title}</h1>
      )}
      {placeError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {placeError}
        </div>
      )}

      {isStacked ? (
        /* Stacked layout: form first, summary below — on all screen sizes */
        <div className="flex flex-col gap-4 sm:gap-6">
          {formPanel}
          {config.show_summary && (
            <OrderSummaryPanel
              cfg={config}
              items={displayItems}
              coupon={coupon}
              setCoupon={setCoupon}
              onPlaceOrder={handlePlaceOrder}
              placing={placing}
            />
          )}
        </div>
      ) : (
        /* Split layout: stacked on mobile, side-by-side on sm+ */
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
          <div className="flex-1 min-w-0">{formPanel}</div>
          {config.show_summary && (
            <div className="sm:w-80 sm:shrink-0">
              <OrderSummaryPanel
                cfg={config}
                items={displayItems}
                coupon={coupon}
                setCoupon={setCoupon}
                onPlaceOrder={handlePlaceOrder}
                placing={placing}
              />
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
