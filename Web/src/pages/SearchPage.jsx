import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '../lib/api'
import ProductCard from '../components/ProductCard'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

function toCardShape(p) {
  const price     = p.prices?.[0]
  const sellPrice = price ? Number(price.final_price ?? price.price) : 0
  const origPrice = price?.compare_at_price ? Number(price.compare_at_price) : sellPrice
  const primary   = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
  const img       = primary?.path
    ? `${MEDIA_BASE}${primary.path}`
    : `https://placehold.co/300x300/1a1a1a/555?text=${encodeURIComponent(p.name)}`
  const discount  = origPrice > sellPrice ? Math.round((1 - sellPrice / origPrice) * 100) : 0
  return {
    id:            p.id,
    slug:          p.slug,
    name:          p.name,
    category:      p.Category?.name ?? '',
    price:         sellPrice,
    originalPrice: origPrice,
    rating:        p.avg_rating ?? 4,
    reviews:       p.review_count ?? 0,
    badge:         discount >= 20 ? `${discount}% off` : null,
    img,
    variantCount:  p.variantCount ?? p.variant_count ?? 0,
  }
}

function buildSuggestions(query, products) {
  const q    = query.trim().toLowerCase()
  const seen = new Set([q])
  const out  = [query.trim()]

  // Unique category names that include or are related to the query
  for (const p of products) {
    if (out.length >= 5) break
    const cat = p.category
    if (cat && !seen.has(cat.toLowerCase())) {
      seen.add(cat.toLowerCase())
      out.push(cat)
    }
  }

  // Short product names for remaining slots
  for (const p of products) {
    if (out.length >= 5) break
    const name = p.name.length > 32 ? p.name.slice(0, 32) + '…' : p.name
    const key  = name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(name)
    }
  }

  return out
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [query,       setQuery]       = useState(searchParams.get('q')?.trim() ?? '')
  const [products,    setProducts]    = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(false)

  // Sync query from URL when navbar updates it
  useEffect(() => {
    setQuery(searchParams.get('q')?.trim() ?? '')
  }, [searchParams])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setProducts([]); setSuggestions([]); setTotal(0); setError(false)
      return
    }
    const timer = setTimeout(() => {
      setLoading(true)
      setError(false)
      productsApi.list({ search: q, limit: 24, sort: 'relevance' })
        .then(data => {
          const rows = (data?.rows ?? []).map(toCardShape)
          setProducts(rows)
          setTotal(data?.count ?? 0)
          setSuggestions(buildSuggestions(q, rows))
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function applyQuery(text) {
    setSearchParams({ q: text }, { replace: true })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* Empty prompt */}
        {!query.trim() && (
          <p className="text-gray-400 text-sm text-center pt-16">Start typing to search</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-20 gap-2 text-center">
            <p className="text-gray-900 font-medium">Something went wrong</p>
            <p className="text-gray-500 text-sm">Could not load results. Please try again.</p>
          </div>
        )}

        {/* Suggestions + results */}
        {!loading && !error && query.trim() && (
          <>
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="mb-5 divide-y divide-gray-100">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => applyQuery(s)}
                      className="flex items-center gap-3 w-full py-2.5 text-left hover:bg-gray-50 rounded-lg px-2 transition"
                    >
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                      </svg>
                      <span className="text-sm text-gray-800 truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* No results */}
            {products.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-2 text-center">
                <p className="text-gray-900 font-medium">No results for "{query}"</p>
                <p className="text-gray-500 text-sm">Try a different keyword or browse categories</p>
              </div>
            )}

            {/* Result count label */}
            {products.length > 0 && (
              <p className="text-gray-500 text-sm mb-4">
                Showing results for <span className="text-gray-900 font-medium">"{query}"</span>
              </p>
            )}

            {/* Product grid */}
            {products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
