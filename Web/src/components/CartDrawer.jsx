import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Loader2, Plus, Pencil, Home, CreditCard, Banknote, Landmark, ChevronDown, ChevronUp, ShieldCheck, Tag } from 'lucide-react'
import { cartApi, addressApi } from '../lib/api'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { useCartDrawer } from '../lib/cartDrawer'
import AddAddressModal from './AddAddressModal'
import PaymentGatewayModal from './PaymentGatewayModal'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const DELIVERY_CHARGE  = 30
const HANDLING_CHARGE  = 12
const SMALL_CART_LIMIT = 149
const SMALL_CART_FEE   = 20

function fmt(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`
}

// ─── UPI app pills ────────────────────────────────────────────────────────────

const UPI_APPS = [
  { id: 'gpay',     label: 'GPay',     bg: '#e8f0fe', color: '#1a73e8', abbr: 'G' },
  { id: 'phonepe',  label: 'PhonePe',  bg: '#f0ebff', color: '#5f259f', abbr: 'P' },
  { id: 'paytm',    label: 'Paytm',    bg: '#e6f0ff', color: '#002970', abbr: 'Pa' },
  { id: 'other',    label: 'Other UPI',bg: '#f3f4f6', color: '#374151', abbr: '⊕' },
]

// ─── Cart item row ────────────────────────────────────────────────────────────

function CartItemRow({ item, onIncrement, onDecrement }) {
  const [busy, setBusy] = useState(false)
  const product   = item.Product ?? {}
  const price     = product.prices?.[0]
  const unitPrice = price ? Number(price.final_price ?? price.price) : 0
  const image     = product.images?.find(i => i.ProductMedia?.is_primary) ?? product.images?.[0]
  const imgSrc    = image?.path ? `${MEDIA_BASE}${image.path}` : null

  async function handle(fn) {
    setBusy(true)
    try { await fn() } catch {}
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
        {imgSrc
          ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{product.name}</p>
        <p className="text-sm font-bold text-gray-800 mt-1">{fmt(unitPrice)}</p>
      </div>
      <div className="flex items-center rounded-full bg-[#ffcc01] overflow-hidden shrink-0">
        <button disabled={busy} onClick={() => handle(onDecrement)} className="w-8 h-8 flex items-center justify-center text-gray-900 font-bold text-lg leading-none disabled:opacity-50 hover:bg-yellow-500 transition-colors">−</button>
        <span className="w-6 text-center text-gray-900 text-sm font-bold">{item.quantity}</span>
        <button disabled={busy} onClick={() => handle(onIncrement)} className="w-8 h-8 flex items-center justify-center text-gray-900 font-bold text-lg leading-none disabled:opacity-50 hover:bg-yellow-500 transition-colors">+</button>
      </div>
    </div>
  )
}

// ─── Address compact card ─────────────────────────────────────────────────────

function AddressCard({ address, onChange }) {
  const parts = [address.address1, address.address2, address.City?.name, address.State?.name, address.pincode].filter(Boolean)
  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Home className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 capitalize">{address.label || 'Home'}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{parts.join(', ')}</p>
          </div>
        </div>
        <button onClick={onChange} className="text-xs font-bold text-green-600 hover:text-green-700 shrink-0 border border-green-500 rounded-lg px-2.5 py-1 hover:bg-green-50 transition-colors">
          Change
        </button>
      </div>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export default function CartDrawer() {
  const { open, closeDrawer }                          = useCartDrawer()
  const { isAuthenticated }                            = useAuth()
  const { cartMap, addItem, decrementItem }            = useCart()
  const navigate                                       = useNavigate()

  const [view,            setView]            = useState('cart')
  const [items,           setItems]           = useState([])
  const [loading,         setLoading]         = useState(false)
  const [addresses,       setAddresses]       = useState([])
  const [addrLoading,     setAddrLoading]     = useState(false)
  const [addModal,        setAddModal]        = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMode,     setPaymentMode]     = useState('upi')
  const [upiApp,          setUpiApp]          = useState('gpay')
  const [summaryOpen,     setSummaryOpen]     = useState(true)
  const [gatewayModal,    setGatewayModal]    = useState(false)
  const [couponCode,      setCouponCode]      = useState('')

  useEffect(() => {
    if (!open) { setView('cart'); return }
    if (!isAuthenticated) return
    setLoading(true)
    cartApi.get()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, isAuthenticated])

  useEffect(() => {
    setItems(prev => prev.filter(item => (cartMap[item.product_id] ?? 0) > 0))
  }, [cartMap])

  const displayItems = items.map(item => ({
    ...item,
    quantity: cartMap[item.product_id] ?? item.quantity,
  }))

  const subtotal     = displayItems.reduce((sum, item) => {
    const price = item.Product?.prices?.[0]
    const unit  = price ? Number(price.final_price ?? price.price) : 0
    return sum + unit * item.quantity
  }, 0)
  const smallCartFee = subtotal > 0 && subtotal < SMALL_CART_LIMIT ? SMALL_CART_FEE : 0
  const grandTotal   = subtotal + DELIVERY_CHARGE + HANDLING_CHARGE + smallCartFee
  const hasItems     = displayItems.length > 0

  function openAddressView() {
    setView('address')
    setAddrLoading(true)
    addressApi.get()
      .then(data => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => setAddresses([]))
      .finally(() => setAddrLoading(false))
  }

  function handleProceedClick() {
    if (!selectedAddress) openAddressView()
    else setView('payment')
  }

  function handleBack() {
    if (view === 'payment') setView('cart')
    else if (view === 'address') setView('cart')
    else closeDrawer()
  }

  const HEADER_TITLES = { cart: 'My Cart', address: 'Select delivery address', payment: 'Payment' }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-gray-50 z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="bg-white flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-gray-800">{HEADER_TITLES[view]}</h2>
        </div>

        {/* ── CART VIEW ── */}
        {view === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto">
              {hasItems && (
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffcc01] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Delivery in 8 minutes</p>
                    <p className="text-xs text-gray-500">Shipment of {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}

              {/* Address banner */}
              {hasItems && (
                <div className="mx-3 mt-3">
                  <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Home className="w-4 h-4 text-amber-500" />
                        </div>
                        {selectedAddress ? (
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 capitalize">{selectedAddress.label || 'Home'}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                              {[selectedAddress.address1, selectedAddress.address2, selectedAddress.City?.name, selectedAddress.State?.name, selectedAddress.pincode].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">Deliver to</p>
                            <p className="text-xs text-gray-400 mt-0.5">No address selected</p>
                          </div>
                        )}
                      </div>
                      <button onClick={openAddressView} className="text-xs font-bold text-green-600 hover:text-green-700 shrink-0 border border-green-500 rounded-lg px-2.5 py-1 hover:bg-green-50 transition-colors">
                        {selectedAddress ? 'Change' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="bg-white mx-3 mt-3 rounded-2xl px-4">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : !isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <p className="text-sm font-semibold text-gray-700">Sign in to view your cart</p>
                    <button onClick={() => { closeDrawer(); navigate('/login') }} className="px-5 py-2 bg-[#ffcc01] text-gray-900 text-sm font-semibold rounded-xl">Login</button>
                  </div>
                ) : displayItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-3xl">🛒</span></div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Your cart is empty</p>
                      <p className="text-xs text-gray-400 mt-0.5">Add items to get started</p>
                    </div>
                    <button onClick={closeDrawer} className="px-5 py-2 bg-[#ffcc01] text-gray-900 text-sm font-semibold rounded-xl">Shop Now</button>
                  </div>
                ) : (
                  displayItems.map(item => (
                    <CartItemRow key={item.product_id} item={item}
                      onIncrement={() => addItem(item.product_id)}
                      onDecrement={() => decrementItem(item.product_id)}
                    />
                  ))
                )}
              </div>

              {/* Bill details */}
              {hasItems && (
                <div className="bg-white mx-3 mt-3 rounded-2xl px-4 py-4">
                  <p className="text-sm font-bold text-gray-800 mb-3">Bill details</p>
                  <div className="flex flex-col gap-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5">🧾 Sub total</span>
                      <span className="font-semibold text-gray-800">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5">🛵 Delivery charge</span>
                      <span className="font-semibold text-gray-800">{fmt(DELIVERY_CHARGE)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1.5">🏷️ Handling charge</span>
                      <span className="font-semibold text-gray-800">{fmt(HANDLING_CHARGE)}</span>
                    </div>
                    {smallCartFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1.5">🛒 Small cart charge</span>
                        <span className="font-semibold text-gray-800">{fmt(smallCartFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Grand total</span>
                      <span className="font-bold text-gray-800">{fmt(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="h-4" />
            </div>

            {hasItems && (
              <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: '#fff36f' }}>
                <div>
                  <p className="text-gray-700 text-[10px] font-semibold uppercase opacity-70 leading-none mb-0.5">Total</p>
                  <p className="text-gray-900 text-base font-bold leading-none">{fmt(grandTotal)}</p>
                </div>
                <button
                  onClick={handleProceedClick}
                  className="flex items-center gap-1 text-white font-bold text-sm bg-green-600 hover:bg-green-700 transition-colors px-4 py-2 rounded-xl"
                >
                  Proceed <span className="text-base">›</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ── ADDRESS VIEW ── */}
        {view === 'address' && (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="mx-3 mt-4">
              <button onClick={() => setAddModal(true)} className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full border-2 border-green-600 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">Add a new address</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium px-4 mt-5 mb-2">Your saved addresses</p>

            {addrLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : addresses.length === 0 ? (
              <div className="mx-3 bg-white rounded-2xl px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No saved addresses yet</p>
              </div>
            ) : (
              <div className="mx-3 flex flex-col gap-3 pb-6">
                {addresses.map(addr => {
                  const parts = [addr.address1, addr.address2, addr.City?.name, addr.State?.name, addr.pincode].filter(Boolean)
                  const isSelected = selectedAddress?.id === addr.id
                  return (
                    <div
                      key={addr.id}
                      onClick={() => { setSelectedAddress(addr); setView('cart') }}
                      className={`bg-white rounded-2xl px-4 py-4 border cursor-pointer transition-colors ${isSelected ? 'border-green-500 bg-green-50/30' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <Home className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 capitalize">{addr.label || 'Home'}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{parts.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
                          </button>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT VIEW ── */}
        {view === 'payment' && (
          <>
            <div className="flex-1 overflow-y-auto bg-gray-50">

              {/* Deliver to */}
              {selectedAddress && (
                <div className="mx-3 mt-3">
                  <AddressCard address={selectedAddress} onChange={openAddressView} />
                </div>
              )}

              {/* Payment methods */}
              <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-4 pb-2">Choose payment method</p>

                {/* UPI */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${paymentMode === 'upi' ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMode('upi')}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-base">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">UPI</p>
                    <p className="text-xs text-gray-400">GPay, PhonePe, Paytm & more</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMode === 'upi' ? 'border-green-600' : 'border-gray-300'}`}>
                    {paymentMode === 'upi' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                  </div>
                </label>

                {/* UPI app sub-options */}
                {paymentMode === 'upi' && (
                  <div className="px-4 pb-3 pt-2 flex gap-2 flex-wrap border-b border-gray-50">
                    {UPI_APPS.map(app => (
                      <button
                        key={app.id}
                        onClick={() => setUpiApp(app.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${upiApp === app.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: app.bg, color: app.color }}>{app.abbr}</span>
                        {app.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Card */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${paymentMode === 'card' ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMode('card')}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Credit / Debit Card</p>
                    <p className="text-xs text-gray-400">Visa, Mastercard, RuPay & more</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMode === 'card' ? 'border-green-600' : 'border-gray-300'}`}>
                    {paymentMode === 'card' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                  </div>
                </label>

                {/* Net Banking */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${paymentMode === 'netbanking' ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMode('netbanking')}
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Net Banking</p>
                    <p className="text-xs text-gray-400">All major banks supported</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMode === 'netbanking' ? 'border-green-600' : 'border-gray-300'}`}>
                    {paymentMode === 'netbanking' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${paymentMode === 'cod' ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                  onClick={() => setPaymentMode('cod')}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                    <p className="text-xs text-gray-400">Pay when your order arrives</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMode === 'cod' ? 'border-green-600' : 'border-gray-300'}`}>
                    {paymentMode === 'cod' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                  </div>
                </label>
              </div>

              {/* Coupon code */}
              <div className="mx-3 mt-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-sm font-bold text-gray-800">Apply coupon</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors uppercase"
                  />
                  <button
                    disabled={!couponCode.trim()}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Order summary */}
              <div className="mx-3 mt-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setSummaryOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Order summary</span>
                    <span className="text-xs text-gray-400 font-medium">({displayItems.length} item{displayItems.length !== 1 ? 's' : ''})</span>
                  </div>
                  {summaryOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {summaryOpen && (
                  <div className="border-t border-gray-50 px-4 py-3 space-y-2.5 text-sm">
                    {displayItems.map(item => {
                      const price = item.Product?.prices?.[0]
                      const unit  = price ? Number(price.final_price ?? price.price) : 0
                      return (
                        <div key={item.product_id} className="flex justify-between items-center gap-2">
                          <span className="text-gray-600 line-clamp-1 flex-1">{item.Product?.name}</span>
                          <span className="text-gray-500 text-xs shrink-0">×{item.quantity}</span>
                          <span className="font-semibold text-gray-800 shrink-0">{fmt(unit * item.quantity)}</span>
                        </div>
                      )
                    })}
                    <div className="border-t border-gray-100 pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Sub total</span><span>{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Delivery</span><span>{fmt(DELIVERY_CHARGE)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Handling</span><span>{fmt(HANDLING_CHARGE)}</span>
                      </div>
                      {smallCartFee > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Small cart fee</span><span>{fmt(smallCartFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 text-sm pt-1 border-t border-gray-100">
                        <span>Total</span><span>{fmt(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="mx-3 mt-3 mb-4 flex items-center gap-2 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <p className="text-[11px] text-gray-400 font-medium">100% secure payments · SSL encrypted</p>
              </div>
            </div>

            {/* Pay Now bar */}
            <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: '#fff36f' }}>
              <div>
                <p className="text-gray-700 text-[10px] font-semibold uppercase opacity-70 leading-none mb-0.5">Pay</p>
                <p className="text-gray-900 text-base font-bold leading-none">{fmt(grandTotal)}</p>
              </div>
              <button
                onClick={() => setGatewayModal(true)}
                className="flex items-center gap-1.5 text-white font-bold text-sm bg-green-600 hover:bg-green-700 transition-colors px-5 py-2 rounded-xl"
              >
                Pay Now
              </button>
            </div>
          </>
        )}
      </div>

      <AddAddressModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onSaved={() => {
          setAddModal(false)
          setAddrLoading(true)
          addressApi.get()
            .then(data => setAddresses(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setAddrLoading(false))
        }}
      />

      <PaymentGatewayModal
        open={gatewayModal}
        onClose={() => setGatewayModal(false)}
        addressId={selectedAddress?.id}
        onPaymentSuccess={() => {
          setItems([])
          setSelectedAddress(null)
          setView('cart')
          setGatewayModal(false)
          closeDrawer()
          window.dispatchEvent(new Event('groco:order-placed'))
        }}
      />
    </>
  )
}
