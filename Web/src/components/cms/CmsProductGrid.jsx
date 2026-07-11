import { useState, useEffect } from 'react'
import ProductCard from '../ProductCard'
import { productsApi } from '../../lib/api'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

// Map CMS logic type → API sort param
const LOGIC_SORT = {
  'trending':        'popular',
  'newly-launched':  'newest',
  'best-sellers':    'popular',
  'hot-deals':       'popular',
  'recently-viewed': 'newest',
  'suggested':       'newest',
  'spotlight':       'popular',
  'top-by-category': 'popular',
  'offers':          'newest',
}

// Tailwind requires full class strings — no dynamic interpolation
const GRID_COLS_CLASS = {
  2: 'grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-4',
  3: 'grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 sm:gap-4',
  4: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-4 sm:gap-4',
  5: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-4 sm:gap-4',
  6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-4 sm:gap-4',
}

function toCardShape(p) {
  // prefer the base product price (no variant), fall back to first variant price
  const price     = p.prices?.find(pr => pr.variant_id == null) ?? p.prices?.[0]
  const sellPrice = price ? Number(price.final_price ?? price.price) : 0
  const origPrice = price?.compare_at_price ? Number(price.compare_at_price) : sellPrice
  const primary   = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
  const img       = primary?.path ? `${MEDIA_BASE}${primary.path}` : `https://placehold.co/300x300/e2e8f0/94a3b8?text=${encodeURIComponent(p.name)}`
  const discount  = origPrice > sellPrice ? Math.round((1 - sellPrice / origPrice) * 100) : 0
  return {
    id:            p.id,
    slug:          p.slug,
    name:          p.name,
    category:      p.Category?.name ?? '',
    price:         sellPrice,
    originalPrice: origPrice,
    rating:        4,
    reviews:       0,
    badge:         null,
    img,
    variantCount:  Number(p.variant_count ?? 0),
  }
}

export default function CmsProductGrid({ config }) {
  const cols     = config.columns ?? 4
  const isScroll = config.layout === 'scroll'
  const maxItems = isScroll ? cols * 2 : cols * (config.grid_max_rows ?? 2)

  const [products, setProducts] = useState(null) // null = loading, [] = loaded empty

  useEffect(() => {
    const sort = LOGIC_SORT[config.logic] ?? 'newest'
    productsApi.list({ sort, limit: maxItems })
      .then(data => {
        const rows = data?.rows ?? []
        setProducts(rows.map(toCardShape))
      })
      .catch(() => setProducts([]))
  }, [config.logic, maxItems])

  const containerClass = isScroll
    ? 'flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0'
    : (GRID_COLS_CLASS[cols] ?? GRID_COLS_CLASS[4])

  const RADIUS_PX = { none: '0px', sm: '6px', md: '12px', lg: '16px', xl: '24px', full: '9999px' }

  const cartBtnStyle = {
    text:         config.cart_btn_text         || 'Add to Cart',
    textColor:    config.cart_btn_text_color   || '#1a1a1a',
    bgColor:      config.cart_btn_bg_color     || '#ca8a04',
    borderColor:  config.cart_btn_border_color || '#ca8a04',
    borderWidth:  config.cart_btn_border_width ?? 0,
    borderRadius: RADIUS_PX[config.cart_btn_border_radius ?? 'md'] ?? '12px',
  }

  const isBordered = config.style === 'bordered'
  const cardStyle = {
    borderRadius: RADIUS_PX[config.card_border_radius ?? 'lg'] ?? '16px',
    shadow:       config.card_shadow ?? true,
    bordered:     isBordered,
    borderWidth:  config.card_border_width ?? 1,
    borderColor:  config.card_border_color || '#e2e8f0',
  }

  // Still loading — show skeleton cards
  if (products === null) return (
    <section style={{ backgroundColor: config.section_bg_color ?? '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className={GRID_COLS_CLASS[cols] ?? GRID_COLS_CLASS[4]}>
          {Array.from({ length: Math.min(maxItems, cols * 2) }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: '220px' }} />
          ))}
        </div>
      </div>
    </section>
  )

  if (!products.length) return null

  return (
    <section style={{ backgroundColor: config.section_bg_color ?? '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{config.heading}</h2>
            {config.subheading && (
              <p className="text-sm text-gray-500 mt-0.5">{config.subheading}</p>
            )}
          </div>
          <a href="#" className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition">
            View All &rarr;
          </a>
        </div>

        <div className={containerClass}>
          {products.map((product) => (
            isScroll
              ? <div key={product.id} className="flex-shrink-0 w-40 sm:w-52"><ProductCard product={product} cartBtnStyle={cartBtnStyle} cardStyle={cardStyle} /></div>
              : <ProductCard key={product.id} product={product} cartBtnStyle={cartBtnStyle} cardStyle={cardStyle} />
          ))}
        </div>
      </div>
    </section>
  )
}
