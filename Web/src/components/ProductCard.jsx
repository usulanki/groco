import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { productsApi } from '../lib/api'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-0.5">({rating})</span>
    </div>
  )
}

// ─── Variant helpers ──────────────────────────────────────────────────────────

function buildAttributeMap(variants) {
  const map = {}
  for (const variant of variants) {
    for (const av of variant.attributeValues ?? []) {
      const name = av.attribute?.name
      if (!name) continue
      if (!map[name]) map[name] = { values: [] }
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
  return variants.find(v => {
    const ids = (v.attributeValues ?? []).map(av => av.id)
    return Object.values(selected).every(selId => ids.includes(selId))
  }) ?? null
}

// ─── Variant Modal ────────────────────────────────────────────────────────────

function VariantModal({ product, onClose, cartBtnStyle }) {
  const { cartMap, addItem, decrementItem } = useCart()
  const [fullProduct, setFullProduct] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState({})
  const [busy, setBusy]               = useState(false)
  const [added, setAdded]             = useState(false)

  useEffect(() => {
    productsApi.getById(product.slug ?? product.id)
      .then(data => {
        setFullProduct(data)
        const variants = data.variants ?? []
        const attrMap  = buildAttributeMap(variants)
        const init     = {}
        Object.entries(attrMap).forEach(([name, { values }]) => {
          if (values[0]) init[name] = values[0].id
        })
        setSelected(init)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id, product.slug])

  const variants        = fullProduct?.variants ?? []
  const attrMap         = buildAttributeMap(variants)
  const resolvedVariant = resolveVariant(variants, selected)
  const variantPrice    = resolvedVariant?.prices?.[0]
  const sellPrice       = variantPrice
    ? Number(variantPrice.final_price ?? variantPrice.price)
    : product.price
  const origPrice = variantPrice?.compare_at_price
    ? Number(variantPrice.compare_at_price)
    : null

  const qty = cartMap[product.id] ?? 0
  const btnBg = cartBtnStyle?.bgColor ?? '#ca8a04'

  async function handleAdd() {
    setBusy(true)
    try {
      await addItem(product.id, resolvedVariant?.id)
      setAdded(true)
      setTimeout(onClose, 600)
    } catch {}
    setBusy(false)
  }

  const primaryImg = fullProduct?.images?.find(i => i.ProductMedia?.is_primary) ?? fullProduct?.images?.[0]
  const imgSrc = primaryImg?.path ? `${MEDIA_BASE}${primaryImg.path}` : product.img

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] sm:max-w-md sm:mx-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header — desktop only */}
        <div className="hidden sm:flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Select Option</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6 pt-2 sm:pt-4">
          {/* Product header */}
          <div className="flex gap-3 mb-5">
            {imgSrc && (
              <img src={imgSrc} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{product.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-base font-bold text-gray-900">₹{sellPrice.toLocaleString('en-IN')}</span>
                {origPrice && origPrice > sellPrice && (
                  <span className="text-xs text-gray-400 line-through">₹{origPrice.toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-yellow-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Variant picker */}
              {Object.entries(attrMap).map(([attrName, { values }]) => (
                <div key={attrName} className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {attrName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.map(v => {
                      const isActive = selected[attrName] === v.id
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelected(s => ({ ...s, [attrName]: v.id }))}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            isActive
                              ? 'text-white border-transparent'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                          style={isActive ? { backgroundColor: btnBg, borderColor: btnBg } : {}}
                        >
                          {v.value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Add button */}
              {qty > 0 && !added ? (
                <div
                  className="mt-4 flex items-center justify-between w-full rounded-xl font-bold text-sm overflow-hidden"
                  style={{ backgroundColor: btnBg, color: '#fff' }}
                >
                  <button
                    onClick={async e => { e.stopPropagation(); setBusy(true); try { await decrementItem(product.id) } catch {} setBusy(false) }}
                    className="px-5 py-3 text-base font-bold hover:opacity-80 transition"
                  >−</button>
                  <span>{qty}</span>
                  <button
                    onClick={async e => { e.stopPropagation(); setBusy(true); try { await addItem(product.id, resolvedVariant?.id) } catch {} setBusy(false) }}
                    className="px-5 py-3 text-base font-bold hover:opacity-80 transition"
                  >+</button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={busy}
                  className="mt-4 w-full py-3.5 rounded-xl font-bold text-white text-sm transition disabled:opacity-60"
                  style={{ backgroundColor: btnBg }}
                >
                  {added ? '✓ Added' : busy ? 'Adding…' : 'Add to Cart'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

export default function ProductCard({ product, cartBtnStyle = null, cardStyle = null }) {
  const { isAuthenticated } = useAuth()
  const { cartMap, addItem, decrementItem } = useCart()
  const navigate = useNavigate()
  const qty = cartMap[product.id] ?? 0
  const [busy, setBusy] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)

  const hasVariants = (product.variantCount ?? 0) > 1
  const discount    = Math.round((1 - product.price / product.originalPrice) * 100)
  const hasShadow   = cardStyle ? cardStyle.shadow : true
  const isBordered  = cardStyle?.bordered ?? false
  const btnBg       = cartBtnStyle?.bgColor ?? '#ca8a04'
  const btnRadius   = cartBtnStyle?.borderRadius ?? '8px'

  async function handleAdd(e) {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) {
      localStorage.setItem('pendingCartItem', JSON.stringify({ productId: product.id, quantity: 1 }))
      navigate('/login')
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

  function handleVariantClick(e) {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) {
      localStorage.setItem('pendingCartItem', JSON.stringify({ productId: product.id, quantity: 1 }))
      navigate('/login')
      return
    }
    setShowVariantModal(true)
  }

  return (
    <>
      <Link
        to={`/product/${product.slug ?? product.id}`}
        className={`bg-white overflow-hidden transition-all duration-200 group hover:-translate-y-1 no-underline block w-full ${hasShadow ? 'hover:shadow-lg' : ''} ${!isBordered ? 'border border-gray-100' : ''}`}
        style={{
          borderRadius: cardStyle ? cardStyle.borderRadius : '16px',
          ...(isBordered ? {
            borderWidth: cardStyle.borderWidth,
            borderStyle: 'solid',
            borderColor: cardStyle.borderColor,
          } : {}),
        }}
      >
        <div className="relative">
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-32 sm:h-44 object-cover"
          />
          {product.badge && (
            <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full ${product.badge === 'Hot' ? 'bg-red-500' : product.badge === 'New' ? 'bg-green-500' : 'bg-brand-500'}`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          <button className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition hover:text-brand-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="p-2 sm:p-3">
          <p className="text-xs text-brand-500 font-medium mb-0.5">{product.category}</p>
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug truncate sm:truncate-none sm:line-clamp-2">
            <span className="sm:hidden">
              {product.name.length > 19 ? product.name.slice(0, 19) + '…' : product.name}
            </span>
            <span className="hidden sm:block">{product.name}</span>
          </h3>
          <StarRating rating={product.rating} />
          <p className="text-xs text-gray-400 mb-2">({product.reviews.toLocaleString()} reviews)</p>

          {/* Price + button row */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through ml-1">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            {qty > 0 && !hasVariants ? (
              <div
                className="flex items-center shrink-0 text-xs font-bold transition overflow-hidden"
                style={{ background: btnBg, color: '#fff', borderRadius: btnRadius }}
              >
                <button onClick={handleDecrement} disabled={busy} className="px-2 py-1 text-base font-bold leading-none hover:opacity-80 transition">−</button>
                <span className="px-1 border-x border-white/30">{qty}</span>
                <button onClick={handleIncrement} disabled={busy} className="px-2 py-1 text-base font-bold leading-none hover:opacity-80 transition">+</button>
              </div>
            ) : (
              <button
                onClick={hasVariants ? handleVariantClick : handleAdd}
                disabled={busy}
                className="shrink-0 text-xs font-bold px-3 py-1.5 transition disabled:opacity-60"
                style={{
                  color:        btnBg,
                  background:   'transparent',
                  border:       `1px solid ${btnBg}`,
                  borderRadius: btnRadius,
                }}
              >
                ADD
              </button>
            )}
          </div>

          {/* Options hint for multi-variant products */}
          {hasVariants && (
            <p
              className="text-xs text-gray-400 mt-1 text-right cursor-pointer hover:text-gray-600 transition"
              onClick={handleVariantClick}
            >
              {product.variantCount} options
            </p>
          )}
        </div>
      </Link>

      {showVariantModal && (
        <VariantModal
          product={product}
          onClose={() => setShowVariantModal(false)}
          cartBtnStyle={cartBtnStyle}
        />
      )}
    </>
  )
}
