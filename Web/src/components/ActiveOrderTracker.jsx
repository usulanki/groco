import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronUp, ChevronDown, Package, ShoppingBag } from 'lucide-react'
import { ordersApi } from '../lib/api'
import { useAuth } from '../lib/auth'

const ACTIVE_STATUSES = ['order_placed', 'pending', 'confirmed', 'shipped']
const POLL_INTERVAL   = 90_000

const STATUS_META = {
  order_placed: { label: 'Order placed',     color: '#f59e0b', bg: '#fffbeb', dot: 'bg-amber-400',  step: 0 },
  pending:      { label: 'Order placed',     color: '#f59e0b', bg: '#fffbeb', dot: 'bg-amber-400',  step: 0 },
  confirmed:    { label: 'Order confirmed',  color: '#3b82f6', bg: '#eff6ff', dot: 'bg-blue-500',   step: 1 },
  shipped:      { label: 'Out for delivery', color: '#8b5cf6', bg: '#f5f3ff', dot: 'bg-violet-500', step: 2 },
}

const STEPS = [
  { key: 'order_placed', icon: '🛒', label: 'Placed'    },
  { key: 'confirmed',    icon: '✅', label: 'Confirmed'  },
  { key: 'shipped',      icon: '🛵', label: 'On the way' },
]

// ─── Single order card ────────────────────────────────────────────────────────

function OrderCard({ order }) {
  const meta    = STATUS_META[order.order_status] ?? STATUS_META.order_placed
  const stepIdx = meta.step

  return (
    <div className="border-t border-gray-50 first:border-0">
      {/* Status pill */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-gray-700 tracking-wide">{order.order_no}</p>
          <p className="text-[10px] text-gray-400">₹{Number(order.total).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit" style={{ backgroundColor: meta.bg }}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${meta.dot}`} />
          <span className="text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-3.5 right-3.5 top-3.5 h-0.5 bg-gray-100 z-0" />
          <div
            className="absolute left-3.5 top-3.5 h-0.5 z-0 transition-all duration-500"
            style={{ width: `${(stepIdx / (STEPS.length - 1)) * (100)}%`, backgroundColor: meta.color }}
          />
          {STEPS.map((s, i) => {
            const done    = i < stepIdx
            const current = i === stepIdx
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                    done    ? 'bg-green-500 shadow-sm'
                    : current ? 'bg-white border-2 shadow-sm'
                    : 'bg-gray-100'
                  }`}
                  style={current ? { borderColor: meta.color } : {}}
                >
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-xs ${!current ? 'grayscale opacity-40' : ''}`}>{s.icon}</span>
                  )}
                </div>
                <p className={`text-[9px] font-semibold leading-none ${current ? 'text-gray-800' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tracker widget ───────────────────────────────────────────────────────────

export default function ActiveOrderTracker() {
  const { isAuthenticated } = useAuth()
  const navigate            = useNavigate()
  const { pathname }        = useLocation()

  const [orders,    setOrders]    = useState([])
  const [expanded,  setExpanded]  = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const intervalRef = useRef(null)

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) { setOrders([]); return }
    try {
      const all    = await ordersApi.list()
      const active = (Array.isArray(all) ? all : [])
        .filter(o => ACTIVE_STATUSES.includes(o.order_status))
        .sort((a, b) => new Date(b.created_ts) - new Date(a.created_ts))

      setOrders(prev => {
        // Re-expand if any status changed
        const changed = active.some(o => {
          const old = prev.find(p => p.id === o.id)
          return old && old.order_status !== o.order_status
        })
        if (changed) setExpanded(true)
        return active
      })

      return active.length
    } catch {
      return 0
    }
  }, [isAuthenticated])

  // Manage polling — only run when there are active orders
  const setupPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(async () => {
      const count = await fetchOrders()
      if (count === 0) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, POLL_INTERVAL)
  }, [fetchOrders])

  useEffect(() => {
    fetchOrders().then(count => { if (count > 0) setupPolling() })
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchOrders, setupPolling])

  // Immediate refresh when an order is placed
  useEffect(() => {
    async function onOrderPlaced() {
      setDismissed(false)
      setExpanded(true)
      const count = await fetchOrders()
      if (count > 0) setupPolling()
    }
    window.addEventListener('groco:order-placed', onOrderPlaced)
    return () => window.removeEventListener('groco:order-placed', onOrderPlaced)
  }, [fetchOrders, setupPolling])

  if (!isAuthenticated || orders.length === 0 || dismissed || pathname === '/search') return null

  return (
    <div className="fixed bottom-5 right-5 z-40 w-72 rounded-2xl shadow-xl border border-gray-100 bg-white overflow-hidden">

      {/* Coloured top strip — use first order's colour */}
      <div className="h-1 w-full" style={{ backgroundColor: STATUS_META[orders[0]?.order_status]?.color ?? STATUS_META.order_placed.color }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">
              Active orders
            </p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              {orders.length} order{orders.length > 1 ? 's' : ''} in progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Orders list */}
      {expanded && (
        <>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => navigate('/account?tab=orders')}
              className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors px-4 py-1.5 rounded-lg"
            >
              View all orders
            </button>
          </div>
        </>
      )}
    </div>
  )
}
