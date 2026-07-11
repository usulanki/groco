import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { useAuth } from '../lib/auth'
import { useWishlist } from '../lib/wishlist'
import { ordersApi, addressApi, locationsApi } from '../lib/api'

// ── Mock data ─────────────────────────────────────────────────────────────────



// ── Shared utilities ──────────────────────────────────────────────────────────

const STATUS_STYLE = {
  delivered:  'bg-green-50 text-green-700 border border-green-100',
  shipped:    'bg-blue-50 text-blue-700 border border-blue-100',
  processing: 'bg-amber-50 text-amber-700 border border-amber-100',
  confirmed:  'bg-amber-50 text-amber-700 border border-amber-100',
  pending:    'bg-slate-50 text-slate-600 border border-slate-200',
  cancelled:  'bg-red-50 text-red-500 border border-red-100',
}

function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[status] ?? STATUS_STYLE.pending}`}>
      {label}
    </span>
  )
}

function PasswordInput({ value, onChange, required = false }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        required={required}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
      />
      <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show
          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        }
      </button>
    </div>
  )
}

// ── Shared content panels (reused across all layouts) ─────────────────────────

const ORDER_FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'pending',    label: 'Pending'    },
  { key: 'confirmed',  label: 'Confirmed'  },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped'    },
  { key: 'delivered',  label: 'Delivered'  },
  { key: 'cancelled',  label: 'Cancelled'  },
]

function formatOrderDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function orderItemCount(order) {
  return order.OrderItems?.reduce((s, i) => s + (i.quantity ?? 1), 0) ?? 0
}

function OrderDetailView({ order, onBack }) {
  const items = order.OrderItems ?? []
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-gray-900">#{order.order_no}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatOrderDate(order.created_ts)}</p>
        </div>
        <StatusBadge status={order.order_status} />
      </div>

      {/* Items */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</p>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.Product?.name ?? `Product #${item.product_id}`}</p>
                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</p>
              </div>
              <p className="text-sm font-bold text-gray-900 ml-4 shrink-0">
                ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="border border-gray-100 rounded-xl px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        {Number(order.tax) > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span>
            <span>₹{Number(order.tax).toLocaleString('en-IN')}</span>
          </div>
        )}
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment & Source */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>Payment: <span className="font-semibold text-gray-700 capitalize">{order.payment_mode}</span></span>
        <span>Source: <span className="font-semibold text-gray-700">{order.source}</span></span>
      </div>
    </div>
  )
}

function OrdersPanel() {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    ordersApi.list()
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-12">
      <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  )

  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {ORDER_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              filter === f.key ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0
        ? <p className="text-center py-12 text-sm text-gray-400">No orders found</p>
        : filtered.map(order => {
            const count = orderItemCount(order)
            return (
              <div key={order.id} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-gray-900">#{order.order_no}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatOrderDate(order.created_ts)} · {count} item{count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900 hidden sm:block">₹{Number(order.total).toLocaleString('en-IN')}</span>
                  <StatusBadge status={order.order_status} />
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition"
                  >
                    Details →
                  </button>
                </div>
              </div>
            )
          })
      }
    </div>
  )
}

function ProfileFormPanel({ user, roundedInputs = true }) {
  const [fname,  setFname]  = useState(user?.fname ?? '')
  const [lname,  setLname]  = useState(user?.lname ?? '')
  const [email,  setEmail]  = useState(user?.email ?? '')
  const [phone,  setPhone]  = useState('')
  const [gender, setGender] = useState('male')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = `w-full border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${roundedInputs ? 'rounded-xl' : 'rounded'}`

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-4 pb-1">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0">
          {fname.charAt(0)}{lname.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{fname} {lname}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">First name</label>
          <input type="text" value={fname} onChange={e => setFname(e.target.value)} required className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Last name</label>
          <input type="text" value={lname} onChange={e => setLname(e.target.value)} required className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Gender</label>
        <div className="flex items-center gap-5">
          {['male', 'female'].map(g => (
            <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} className="accent-brand-500 w-4 h-4" />
              {g === 'male' ? 'Male' : 'Female'}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={loading}
          className={`bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 transition ${roundedInputs ? 'rounded-xl' : 'rounded'}`}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </form>
  )
}

function AccountAddressForm({ onSaved, onCancel }) {
  const [form,    setForm]    = useState({ address1: '', address2: '', pincode: '' })
  const [states,  setStates]  = useState([])
  const [cities,  setCities]  = useState([])
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
    if (!form.address1.trim() || !stateId || !cityId || !form.pincode.trim()) {
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

  const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition bg-white'
  const sel = `${inp} disabled:opacity-50`

  return (
    <form onSubmit={handleSave} className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-sm font-semibold text-gray-700">New Address</p>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Address Line 1 *</label>
        <input value={form.address1} onChange={e => setForm(p => ({ ...p, address1: e.target.value }))}
          placeholder="House / Flat / Building" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Address Line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
        <input value={form.address2} onChange={e => setForm(p => ({ ...p, address2: e.target.value }))}
          placeholder="Street / Area" className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">State *</label>
          <select value={stateId} onChange={e => setStateId(e.target.value)} className={sel}>
            <option value="">Select state</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">City *</label>
          <select value={cityId} onChange={e => setCityId(e.target.value)} disabled={!stateId} className={sel}>
            <option value="">Select city</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Pincode *</label>
        <input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
          placeholder="400001" className={inp} />
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2">
          {saving && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          Save Address
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
          Cancel
        </button>
      </div>
    </form>
  )
}

function AddressesPanel() {
  const [addresses, setAddresses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [removing,  setRemoving]  = useState(null)

  useEffect(() => {
    addressApi.get()
      .then(data => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(newAddr) {
    setAddresses(prev => [newAddr, ...prev])
    setShowForm(false)
  }

  async function handleRemove(id) {
    setRemoving(id)
    try {
      await addressApi.remove(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch {}
    setRemoving(null)
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  )

  return (
    <div className="space-y-3">
      {showForm
        ? <AccountAddressForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        : (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-brand-500 hover:border-brand-300 hover:bg-brand-50/40 transition">
            <span className="text-lg font-bold leading-none">+</span> Add New Address
          </button>
        )
      }

      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-4 text-center">No addresses saved yet.</p>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {addresses.map(addr => (
          <div key={addr.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">{addr.address1}</p>
              <button
                onClick={() => handleRemove(addr.id)}
                disabled={removing === addr.id}
                className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50 transition shrink-0 ml-2"
              >
                {removing === addr.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
            {addr.address2 && <p className="text-xs text-gray-500 mb-0.5">{addr.address2}</p>}
            <p className="text-sm text-gray-500">
              {addr.City?.name}{addr.City ? ', ' : ''}{addr.State?.name} — {addr.pincode}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

function WishlistPanel() {
  const { wishlistItems } = useWishlist()
  const [activeCategory, setActiveCategory] = useState('All')

  if (wishlistItems.length === 0) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <HeartIcon className="w-8 h-8 text-gray-200" />
      </div>
      <p className="text-sm font-semibold text-gray-500">Your wishlist is empty</p>
      <Link to="/" className="mt-2 inline-block text-sm font-bold text-brand-500 hover:text-brand-600 transition">Browse products →</Link>
    </div>
  )

  const categories = ['All', ...new Set(
    wishlistItems.map(item => item.Product?.Category?.name).filter(Boolean)
  )]

  const filtered = activeCategory === 'All'
    ? wishlistItems
    : wishlistItems.filter(item => item.Product?.Category?.name === activeCategory)

  return (
    <div className="flex flex-col gap-4">
      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeCategory === cat
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {filtered.map(item => {
          const product = item.Product
          if (!product) return null
          const image  = product.images?.find(img => img.ProductMedia?.is_primary) ?? product.images?.[0]
          const imgSrc = image?.path ? `${MEDIA_BASE}${image.path}` : null

          return (
            <Link
              key={item.id}
              to={`/product/${product.slug ?? product.id}`}
              className="aspect-square rounded-xl overflow-hidden bg-slate-100 block no-underline hover:opacity-90 transition-opacity"
            >
              {imgSrc
                ? <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BagIcon className="w-6 h-6 text-gray-300" /></div>
              }
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function PasswordPanel() {
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (next.length < 8) { setError('Min. 8 characters'); return }
    if (next !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false); setSaved(true)
    setCurrent(''); setNext(''); setConfirm('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Current password</label>
        <PasswordInput value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
        <PasswordInput value={next} onChange={e => setNext(e.target.value)} required />
        <p className="text-xs text-gray-400 mt-1.5">Min. 8 characters with at least one number.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm new password</label>
        <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition">
          {loading ? 'Updating…' : 'Update Password'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Updated!</span>}
      </div>
    </form>
  )
}

function PanCardPanel() {
  const [pan, setPan]         = useState('')
  const [editing, setEditing] = useState(false)
  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">Required for orders above ₹2,00,000</p>
      {editing ? (
        <div className="space-y-3 max-w-xs">
          <input type="text" value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F" maxLength={10}
            className="border border-gray-300 rounded px-3.5 py-2.5 text-sm w-full font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-6 py-2 rounded transition">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="max-w-xs space-y-3">
          <div className="border border-gray-200 rounded px-3.5 py-2.5 text-sm text-gray-500 min-h-[42px]">
            {pan || <span className="text-gray-400">Enter PAN number</span>}
          </div>
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-blue-500 hover:text-blue-600 transition">
            {pan ? 'Edit' : 'Add PAN Card'}
          </button>
        </div>
      )}
    </div>
  )
}

function GiftCardsPanel() {
  return (
    <div className="border border-gray-200 rounded-xl p-8 text-center max-w-sm">
      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <GiftIcon className="w-7 h-7 text-green-500" />
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">₹0</p>
      <p className="text-sm text-gray-400 mb-5">Gift Card Balance</p>
      <button className="text-sm font-bold text-brand-500 hover:text-brand-600 border border-brand-200 rounded-lg px-5 py-2 transition">Add Gift Card</button>
    </div>
  )
}

function SavedUpiPanel() {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center max-w-sm">
      <p className="text-sm text-gray-400 mb-3">No UPI IDs saved yet</p>
      <button className="text-sm font-bold text-brand-500 hover:text-brand-600 transition">+ Add UPI ID</button>
    </div>
  )
}

function SavedCardsPanel() {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center max-w-sm">
      <p className="text-sm text-gray-400 mb-3">No cards saved yet</p>
      <button className="text-sm font-bold text-brand-500 hover:text-brand-600 transition">+ Add Card</button>
    </div>
  )
}

function MyStuffPanel() {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      {[
        { label: 'My Coupons',    sub: 'View available coupons'  },
        { label: 'My Reviews',    sub: 'Products you reviewed'   },
        { label: 'My Questions',  sub: 'Questions you asked'     },
        { label: 'Notifications', sub: 'Manage your alerts'      },
      ].map(item => (
        <button key={item.label} className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 text-left transition">
          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT 1 — FLIPKART
// Left sidebar with category-style nav, right panel with inline-editable sections
// ══════════════════════════════════════════════════════════════════════════════

function FkSection({ title, onEdit, editing, children }) {
  return (
    <div className="py-7 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {onEdit && (
          <button onClick={onEdit} className={`text-sm font-semibold transition ${editing ? 'text-gray-400 hover:text-gray-600' : 'text-blue-500 hover:text-blue-600'}`}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function FkReadBox({ value, placeholder }) {
  return (
    <div className="border border-gray-200 rounded px-3.5 py-2.5 text-sm text-gray-500 bg-white min-h-[42px]">
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  )
}

function FkPersonalInfo({ user }) {
  const [editing, setEditing] = useState(false)
  const [fname,   setFname]   = useState(user?.fname ?? '')
  const [lname,   setLname]   = useState(user?.lname ?? '')
  const [gender,  setGender]  = useState('male')
  const [loading, setLoading] = useState(false)

  async function save(e) {
    e.preventDefault(); setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false); setEditing(false)
  }

  return (
    <FkSection title="Personal Information" onEdit={() => setEditing(p => !p)} editing={editing}>
      {editing ? (
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={fname} onChange={e => setFname(e.target.value)} placeholder="First Name" required
              className="border border-gray-300 rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
            <input value={lname} onChange={e => setLname(e.target.value)} placeholder="Last Name" required
              className="border border-gray-300 rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2.5">Your Gender</p>
            <div className="flex items-center gap-6">
              {['male', 'female'].map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="fk-gender" value={g} checked={gender === g} onChange={() => setGender(g)} className="accent-blue-500 w-4 h-4" />
                  {g === 'male' ? 'Male' : 'Female'}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-8 py-2.5 rounded transition">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FkReadBox value={fname} placeholder="First Name" />
            <FkReadBox value={lname} placeholder="Last Name" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2.5">Your Gender</p>
            <div className="flex items-center gap-6">
              {['male', 'female'].map(g => (
                <label key={g} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${gender === g ? 'border-blue-500' : 'border-gray-300'}`}>
                    {gender === g && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
                  </span>
                  {g === 'male' ? 'Male' : 'Female'}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </FkSection>
  )
}

function FkEmailSection({ user }) {
  const [editing, setEditing] = useState(false)
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)

  async function save(e) {
    e.preventDefault(); setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false); setEditing(false)
  }

  return (
    <FkSection title="Email Address" onEdit={() => setEditing(p => !p)} editing={editing}>
      {editing ? (
        <form onSubmit={save} className="space-y-3 max-w-sm">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="border border-gray-300 rounded px-3.5 py-2.5 text-sm w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-8 py-2.5 rounded transition">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="max-w-sm"><FkReadBox value={email} placeholder="Email address" /></div>
      )}
    </FkSection>
  )
}

function FkMobileSection({ user }) {
  const [editing, setEditing] = useState(false)
  const [phone,   setPhone]   = useState(user?.phone ?? '')
  const [loading, setLoading] = useState(false)

  async function save(e) {
    e.preventDefault(); setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false); setEditing(false)
  }

  return (
    <FkSection title="Mobile Number" onEdit={() => setEditing(p => !p)} editing={editing}>
      {editing ? (
        <form onSubmit={save} className="space-y-3 max-w-sm">
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
            className="border border-gray-300 rounded px-3.5 py-2.5 text-sm w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-8 py-2.5 rounded transition">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="max-w-sm"><FkReadBox value={phone} placeholder="+91 98765 43210" /></div>
      )}
    </FkSection>
  )
}

function FkFaqs() {
  const FAQS = [
    { q: 'What happens when I update my email?',    a: 'Your login credentials will be updated. You will receive a confirmation email at your new address.' },
    { q: 'Can I have multiple delivery addresses?', a: 'Yes, you can save multiple delivery addresses and choose one as your default.' },
    { q: 'How do I delete my account?',             a: 'Please contact our support team to request account deletion.' },
  ]
  const [open, setOpen] = useState(null)
  return (
    <FkSection title="FAQs">
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-gray-200 rounded overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 text-left hover:bg-gray-50 transition">
              {faq.q}
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-3 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-4 pb-3 text-sm text-gray-500">{faq.a}</div>}
          </div>
        ))}
      </div>
    </FkSection>
  )
}

const FK_NAV = [
  { key: 'orders',    topLevel: true,  label: 'MY ORDERS',         icon: <BagIcon />,         chevron: true  },
  { section: 'ACCOUNT SETTINGS', icon: <UserOutlineIcon />, items: [
    { key: 'profile',   label: 'Profile Information' },
    { key: 'addresses', label: 'Manage Addresses'    },
    { key: 'wishlist',  label: 'My Wishlist'         },
  ]},
  { section: 'PAYMENTS', icon: <WalletIcon />, items: [
    { key: 'upi',       label: 'Saved UPI'   },
    { key: 'cards',     label: 'Saved Cards' },
  ]},
]

const FK_PANELS = {
  profile:   user => <div className="px-8 py-2"><FkPersonalInfo user={user} /><FkEmailSection user={user} /><FkMobileSection user={user} /><FkFaqs /></div>,
  orders:    ()   => <div className="px-8 py-6"><OrdersPanel /></div>,
  addresses: ()   => <div className="px-8 py-6"><AddressesPanel /></div>,
  upi:       ()   => <div className="px-8 py-6"><h2 className="text-base font-bold text-gray-900 mb-4">Saved UPI</h2><SavedUpiPanel /></div>,
  cards:     ()   => <div className="px-8 py-6"><h2 className="text-base font-bold text-gray-900 mb-4">Saved Cards</h2><SavedCardsPanel /></div>,
  wishlist:  ()   => <div className="px-8 py-6"><h2 className="text-base font-bold text-gray-900 mb-4">My Wishlist</h2><WishlistPanel /></div>,
}

function FlipkartLayout({ user, onLogout, initialTab }) {
  const [activeKey, setActiveKey] = useState(initialTab ?? 'profile')
  const [mobileKey, setMobileKey] = useState(initialTab ?? 'hub')

  const panel = FK_PANELS[activeKey]

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-4 md:py-6">
      <div className="max-w-5xl mx-auto px-4">

        {/* Mobile */}
        <div className="md:hidden">
          {mobileKey === 'hub' ? (
            <div>
              <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <UserFaceIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hello,</p>
                  <p className="text-sm font-extrabold text-gray-900">{user.fname} {user.lname}</p>
                </div>
              </div>
              <div className="bg-white">
                {[
                  { key: 'orders',    label: 'My Orders' },
                  { key: 'profile',   label: 'Profile Information' },
                  { key: 'addresses', label: 'Manage Addresses' },
                  { key: 'wishlist',  label: 'My Wishlist' },
                  { key: 'upi',       label: 'Saved UPI' },
                  { key: 'cards',     label: 'Saved Cards' },
                ].map(item => (
                  <button key={item.key} onClick={() => setMobileKey(item.key)}
                    className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 transition">
                    {item.label}
                    <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition border-t border-gray-100">
                  <LogoutIcon className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 px-4 pt-2 mb-3">
                <button onClick={() => setMobileKey('hub')} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg bg-white text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>
              <div className="bg-white">{FK_PANELS[mobileKey]?.(user)}</div>
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:flex gap-4 items-start">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 self-start">
            <div className="bg-white border border-gray-200 rounded mb-2 px-4 py-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                <UserFaceIcon className="w-9 h-9 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Hello,</p>
                <p className="text-sm font-extrabold text-gray-900 truncate">{user.fname} {user.lname}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded">
              {FK_NAV.map((entry, idx) => {
                if (entry.topLevel) {
                  const active = activeKey === entry.key
                  return (
                    <button key={entry.key} onClick={() => setActiveKey(entry.key)}
                      className={`w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-0 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <span className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-500' : 'text-blue-400'}`}>{entry.icon}</span>
                      <span className={`flex-1 text-xs font-extrabold tracking-wide ${active ? 'text-blue-600' : 'text-gray-700'}`}>{entry.label}</span>
                      {entry.chevron && <ChevronRightIcon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-300'}`} />}
                    </button>
                  )
                }
                return (
                  <div key={entry.section} className="border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3 px-4 py-4">
                      <span className="w-5 h-5 flex-shrink-0 text-blue-400">{entry.icon}</span>
                      <span className="text-xs font-extrabold tracking-wide text-gray-700 uppercase">{entry.section}</span>
                    </div>
                    {entry.items.map(item => {
                      const active = activeKey === item.key
                      return (
                        <button key={item.key} onClick={() => setActiveKey(item.key)}
                          className={`w-full flex items-center justify-between pl-12 pr-4 py-2.5 text-left transition ${
                            active ? 'text-blue-600 font-bold border-l-4 border-blue-500 bg-blue-50/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-transparent'
                          }`}>
                          <span className="text-sm">{item.label}</span>
                          {item.badge !== undefined && <span className={`text-xs font-bold ${active ? 'text-blue-500' : 'text-green-600'}`}>{item.badge}</span>}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition border-t border-gray-100">
                <LogoutIcon className="w-4 h-4 flex-shrink-0" /> Logout
              </button>
            </div>
          </aside>
          {/* Content */}
          <main className="flex-1 min-w-0 bg-white border border-gray-200 rounded py-2">
            {panel?.(user)}
          </main>
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT 2 — MODERN
// Gradient welcome banner, stats overview, icon-based compact sidebar, cards
// ══════════════════════════════════════════════════════════════════════════════

const MOD_NAV = [
  { key: 'overview',  label: 'Overview',       icon: <GridIcon />        },
  { key: 'orders',    label: 'My Orders',       icon: <BagIcon />         },
  { key: 'profile',   label: 'Profile',         icon: <UserOutlineIcon /> },
  { key: 'addresses', label: 'Addresses',       icon: <PinIcon />         },
  { key: 'wishlist',  label: 'Wishlist',        icon: <HeartIcon />       },
  { key: 'password',  label: 'Change Password', icon: <LockIcon />        },
]

function ModernOverview({ user, setTab }) {
  const { wishlistItems } = useWishlist()
  const [orders,    setOrders]    = useState([])
  const [addrCount, setAddrCount] = useState(0)

  useEffect(() => {
    ordersApi.list()
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
    addressApi.get()
      .then(data => setAddrCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [])

  const stats = [
    { label: 'Total Orders', value: orders.length,                                              color: 'bg-blue-50 text-blue-500',    icon: <BagIcon /> },
    { label: 'Delivered',    value: orders.filter(o => o.order_status === 'delivered').length,  color: 'bg-green-50 text-green-600',  icon: <CheckIcon /> },
    { label: 'Wishlist',     value: wishlistItems.length,                                       color: 'bg-pink-50 text-pink-500',    icon: <HeartIcon /> },
    { label: 'Addresses',    value: addrCount,                                                  color: 'bg-purple-50 text-purple-600',icon: <PinIcon /> },
  ]

  return (
    <div className="space-y-5">
      {/* Gradient banner */}
      <div className="relative bg-gradient-to-br from-brand-500 via-orange-400 to-amber-400 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/10 rounded-full" />
        <p className="text-sm font-medium text-white/75 mb-1">Welcome back</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{user.fname} {user.lname} 👋</h1>
        <p className="text-sm text-white/60 mt-1">{user.email}</p>
        <button onClick={() => setTab('orders')}
          className="mt-4 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
          View my orders →
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <div className="w-5 h-5">{s.icon}</div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
          <button onClick={() => setTab('orders')} className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition">View all →</button>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.length === 0
            ? <p className="text-center py-8 text-sm text-gray-400">No orders yet</p>
            : orders.slice(0, 3).map(order => {
                const count = orderItemCount(order)
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 text-brand-400"><BagIcon /></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">#{order.order_no}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatOrderDate(order.created_ts)} · {count} item{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 hidden sm:block">₹{Number(order.total).toLocaleString('en-IN')}</span>
                      <StatusBadge status={order.order_status} />
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}

function ModernLayout({ user, onLogout, initialTab }) {
  const [tab, setTab]             = useState(initialTab ?? 'overview')
  const [mobileHub, setMobileHub] = useState(!initialTab)
  const { wishlistItems } = useWishlist()

  const CONTENT = {
    overview:  <ModernOverview user={user} setTab={setTab} />,
    orders:    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><OrdersPanel /></div>,
    profile:   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6"><ProfileFormPanel user={user} /></div>,
    addresses: <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6"><AddressesPanel /></div>,
    wishlist:  <WishlistPanel />,
    password:  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6"><PasswordPanel /></div>,
  }

  const MOBILE_NAV = [
    { key: 'orders',    label: 'My Orders',       sub: 'View all orders',                 iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   icon: <BagIcon /> },
    { key: 'profile',   label: 'Profile',          sub: 'Personal info',                   iconBg: 'bg-purple-50', iconColor: 'text-purple-500', icon: <UserOutlineIcon /> },
    { key: 'addresses', label: 'Addresses',        sub: 'Manage addresses',                iconBg: 'bg-green-50',  iconColor: 'text-green-600',  icon: <PinIcon /> },
    { key: 'wishlist',  label: 'Wishlist',         sub: `${wishlistItems.length} items`,   iconBg: 'bg-pink-50',   iconColor: 'text-pink-500',   icon: <HeartIcon /> },
    { key: 'password',  label: 'Security',         sub: 'Change password',                 iconBg: 'bg-amber-50',  iconColor: 'text-amber-500',  icon: <LockIcon /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {mobileHub ? (
            <>
              <div className="relative bg-gradient-to-br from-brand-500 via-orange-400 to-amber-400 rounded-2xl p-5 text-white overflow-hidden">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                <div className="relative flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 font-extrabold text-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                    {user.fname?.charAt(0)}{user.lname?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg">{user.fname} {user.lname}</p>
                    <p className="text-sm text-white/70">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MOBILE_NAV.map(s => (
                  <button key={s.key} onClick={() => { setTab(s.key); setMobileHub(false) }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left hover:border-brand-200 active:scale-[0.98] transition">
                    <div className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <div className="w-5 h-5">{s.icon}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm py-4 text-sm font-semibold text-red-500 hover:bg-red-50 active:scale-[0.98] transition">
                <LogoutIcon className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileHub(true)}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 transition flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-lg font-extrabold text-gray-900 capitalize">{tab}</h1>
              </div>
              {CONTENT[tab]}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:flex gap-6 items-start">
          <aside className="flex flex-col w-52 lg:w-56 flex-shrink-0 sticky top-6 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-brand-500 text-white font-extrabold text-base flex items-center justify-center flex-shrink-0">
                {user.fname?.charAt(0)}{user.lname?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.fname} {user.lname}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
              {MOD_NAV.map(item => (
                <button key={item.key} onClick={() => setTab(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left mb-0.5 last:mb-0 ${
                    tab === item.key ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <span className={`w-[18px] h-[18px] flex-shrink-0 ${tab === item.key ? 'text-brand-500' : 'text-gray-400'}`}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-50 mt-1 pt-1">
                <button onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
                  <span className="w-[18px] h-[18px] flex-shrink-0"><LogoutIcon /></span>
                  Logout
                </button>
              </div>
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{CONTENT[tab]}</main>
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT 3 — TOP TABS
// No sidebar. User banner at top, horizontal pill tabs, clean card content.
// ══════════════════════════════════════════════════════════════════════════════

const TABS_NAV = [
  { key: 'profile',   label: 'Profile'   },
  { key: 'orders',    label: 'Orders'    },
  { key: 'addresses', label: 'Addresses' },
  { key: 'wishlist',  label: 'Wishlist'  },
  { key: 'payments',  label: 'Payments'  },
  { key: 'password',  label: 'Security'  },
]

function TopTabsLayout({ user, onLogout, initialTab }) {
  const [tab, setTab] = useState(initialTab ?? 'profile')

  const CONTENT = {
    profile:   <ProfileFormPanel user={user} roundedInputs />,
    orders:    <OrdersPanel />,
    addresses: <AddressesPanel />,
    wishlist:  <WishlistPanel />,
    payments: (
      <div className="grid md:grid-cols-2 gap-4">
        <div><h3 className="text-sm font-bold text-gray-700 mb-3">Saved UPI</h3><SavedUpiPanel /></div>
        <div><h3 className="text-sm font-bold text-gray-700 mb-3">Saved Cards</h3><SavedCardsPanel /></div>
      </div>
    ),
    password: <PasswordPanel />,
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                {user.fname?.charAt(0)}{user.lname?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-extrabold text-lg leading-tight">{user.fname} {user.lname}</p>
                <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
              </div>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white text-xs font-semibold border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition">
              Sign out
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto no-scrollbar border-t border-gray-100">
            {TABS_NAV.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
                  tab === t.key
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {CONTENT[tab]}
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT 4 — MINIMAL
// Ultra-clean. Left text-only nav, right minimal content. No card shadows.
// ══════════════════════════════════════════════════════════════════════════════

const MIN_SECTIONS = [
  { key: 'profile',   label: 'Personal Details'    },
  { key: 'orders',    label: 'Order History'        },
  { key: 'addresses', label: 'Delivery Addresses'   },
  { key: 'wishlist',  label: 'Saved Items'          },
  { key: 'password',  label: 'Password & Security'  },
  { key: 'payments',  label: 'Payment Methods'      },
]

function MinimalLayout({ user, onLogout, initialTab }) {
  const [tab, setTab] = useState(initialTab ?? 'profile')

  const CONTENT = {
    profile:   <ProfileFormPanel user={user} roundedInputs={false} />,
    orders:    <OrdersPanel />,
    addresses: <AddressesPanel />,
    wishlist:  <WishlistPanel />,
    password:  <PasswordPanel />,
    payments: (
      <div className="space-y-6">
        <div><h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Saved UPI</h3><SavedUpiPanel /></div>
        <div><h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Saved Cards</h3><SavedCardsPanel /></div>
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fname} {user.lname}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onLogout} className="text-sm font-semibold text-gray-400 hover:text-red-500 transition">
            Sign out
          </button>
        </div>

        <div className="flex gap-12 items-start">
          {/* Nav */}
          <aside className="w-44 shrink-0 sticky top-6">
            <nav className="space-y-0.5">
              {MIN_SECTIONS.map(s => (
                <button key={s.key} onClick={() => setTab(s.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition ${
                    tab === s.key
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
              {MIN_SECTIONS.find(s => s.key === tab)?.label}
            </h2>
            {CONTENT[tab]}
          </main>
        </div>

      </div>
    </div>
  )
}

// ── Layout map ────────────────────────────────────────────────────────────────

const LAYOUTS = {
  flipkart: FlipkartLayout,
  modern:   ModernLayout,
  tabs:     TopTabsLayout,
  minimal:  MinimalLayout,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [layout, setLayout] = useState('flipkart') // fetched from CMS config

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  // Fetch CMS config to get the chosen layout
  useEffect(() => {
    fetch('/api/cms/account-page')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.config?.layout) setLayout(d.config.layout) })
      .catch(() => {})
  }, [])

  if (!user) return <PageLoader />

  function handleLogout() {
    logout()
    navigate('/')
  }

  // Map query param tab names to layout-internal keys
  const TAB_MAP = { orders: 'orders', wishlist: 'wishlist' }
  const initialTab = TAB_MAP[searchParams.get('tab')] ?? null

  const Layout = LAYOUTS[layout] ?? FlipkartLayout
  return <Layout user={user} onLogout={handleLogout} initialTab={initialTab} />
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.8} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.8} />
    </svg>
  )
}

function BagIcon({ className = 'w-full h-full' }) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

function UserOutlineIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function PinIcon({ className = 'w-full h-full' }) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function HeartIcon({ className = 'w-full h-full' }) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z" />
      <circle cx="17" cy="13" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function StuffIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function LogoutIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function GiftIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

function UserFaceIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="16" r="7" fill="white" fillOpacity="0.9" />
      <ellipse cx="20" cy="33" rx="12" ry="8" fill="white" fillOpacity="0.9" />
    </svg>
  )
}
