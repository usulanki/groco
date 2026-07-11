import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../../lib/api'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const LOGIC_SORT = {
  'flash-sale':   'popular',
  'hot-deals':    'popular',
  'time-limited': 'newest',
  'best-deals':   'popular',
  'clearance':    'newest',
}

function toCardShape(p) {
  const price     = p.prices?.[0]
  const sellPrice = price ? Number(price.final_price ?? price.price) : 0
  const origPrice = price?.compare_at_price ? Number(price.compare_at_price) : sellPrice
  const primary   = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
  const img       = primary?.path ? `${MEDIA_BASE}${primary.path}` : `https://placehold.co/300x300/e2e8f0/94a3b8?text=${encodeURIComponent(p.name)}`
  return {
    id:            p.id,
    slug:          p.slug,
    name:          p.name,
    price:         sellPrice,
    originalPrice: origPrice,
    rating:        4,
    reviews:       0,
    img,
  }
}

const SECTION_BG = {
  white:  'bg-white',
  blue:   'bg-blue-700',
  yellow: 'bg-gradient-to-r from-yellow-400 to-orange-400',
  dark:   'bg-slate-900',
  custom: '',
}

const TEXT_PALETTE = {
  white:  { title: 'text-slate-900', sub: 'text-slate-500', card: 'bg-white border border-slate-100 shadow-sm', name: 'text-slate-700', og: 'text-slate-400' },
  blue:   { title: 'text-white',     sub: 'text-blue-200',  card: 'bg-white/10 border border-white/15',         name: 'text-white',     og: 'text-white/40'  },
  yellow: { title: 'text-slate-900', sub: 'text-slate-700', card: 'bg-white/80 border border-yellow-200',        name: 'text-slate-700', og: 'text-slate-400' },
  dark:   { title: 'text-white',     sub: 'text-slate-400', card: 'bg-slate-800 border border-slate-700',        name: 'text-slate-200', og: 'text-slate-500' },
  custom: { title: 'text-slate-900', sub: 'text-slate-500', card: 'bg-white border border-slate-100 shadow-sm', name: 'text-slate-700', og: 'text-slate-400' },
}

const GRID_COLS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-5',
}

function CountdownTimer({ config, color }) {
  const [secs, setSecs] = useState(() => {
    if (config.timer_type === 'hours') return config.timer_hours * 3600
    if (config.timer_type === 'days')  return config.timer_days  * 86400
    if (config.timer_type === 'datetime' && config.timer_end_date) {
      return Math.max(0, Math.floor((new Date(config.timer_end_date) - Date.now()) / 1000))
    }
    return config.timer_hours * 3600
  })

  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [secs])

  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  const timeStr = `${h}:${m}:${s}`

  const accent = color || config.accent_color || '#ef4444'

  if (config.timer_style === 'box') {
    return (
      <div className="flex items-center gap-1">
        {[h, m, s].map((unit, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-white font-bold text-sm px-2 py-1 rounded-lg tabular-nums min-w-[2.25rem] text-center" style={{ backgroundColor: accent }}>
              {unit}
            </span>
            {i < 2 && <span className="font-bold" style={{ color: accent }}>:</span>}
          </span>
        ))}
      </div>
    )
  }

  if (config.timer_style === 'pill') {
    return (
      <span className="font-mono font-bold text-sm tabular-nums text-white px-3 py-1 rounded-full" style={{ backgroundColor: accent }}>
        {timeStr}
      </span>
    )
  }

  if (config.timer_style === 'outline') {
    return (
      <div className="flex items-center gap-1">
        {[h, m, s].map((unit, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-sm font-bold px-2 py-1 rounded-lg tabular-nums min-w-[2.25rem] text-center border-2"
              style={{ borderColor: accent, color: accent }}>
              {unit}
            </span>
            {i < 2 && <span className="font-bold" style={{ color: accent }}>:</span>}
          </span>
        ))}
      </div>
    )
  }

  if (config.timer_style === 'dark') {
    return (
      <div className="flex items-center gap-1">
        {[h, m, s].map((unit, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-white text-sm font-bold px-2 py-1 rounded-lg bg-slate-900 tabular-nums min-w-[2.25rem] text-center">
              {unit}
            </span>
            {i < 2 && <span className="font-bold" style={{ color: accent }}>:</span>}
          </span>
        ))}
      </div>
    )
  }

  if (config.timer_style === 'neon') {
    return (
      <div className="flex items-center gap-1">
        {[h, m, s].map((unit, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-white text-sm font-bold px-2 py-1 rounded-lg tabular-nums min-w-[2.25rem] text-center"
              style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}99` }}>
              {unit}
            </span>
            {i < 2 && <span className="font-bold" style={{ color: accent, textShadow: `0 0 6px ${accent}` }}>:</span>}
          </span>
        ))}
      </div>
    )
  }

  return (
    <span className="font-mono font-bold text-sm tabular-nums" style={{ color: accent }}>
      {timeStr}
    </span>
  )
}

function DealCard({ product, palette, showDiscount, showOriginal, showRatings, showSold, accent }) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100)
  const accentColor = accent || '#ef4444'

  return (
    <Link to={`/product/${product.slug ?? product.id}`} className={['rounded-2xl overflow-hidden block no-underline', palette.card].join(' ')}>
      <div className="relative h-24 sm:h-32">
        <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
        {showDiscount && discount > 0 && (
          <span className="absolute top-1.5 left-1.5 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full" style={{ backgroundColor: accentColor }}>
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <p className={['text-[11px] sm:text-xs font-semibold line-clamp-2 mb-1', palette.name].join(' ')}>
          {product.name}
        </p>
        {showRatings && (
          <p className="text-yellow-400 text-[10px] sm:text-xs mb-1">{'★'.repeat(Math.round(product.rating))}</p>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-xs sm:text-sm font-bold" style={{ color: accentColor }}>₹{product.price.toLocaleString('en-IN')}</span>
          {showOriginal && (
            <span className={['text-[10px] sm:text-xs line-through', palette.og].join(' ')}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
        {showSold && (
          <p className={['text-[10px] sm:text-xs mt-0.5', palette.og].join(' ')}>
            {product.reviews.toLocaleString()} sold
          </p>
        )}
      </div>
    </Link>
  )
}

const MARQUEE_SPEED = { slow: '40s', medium: '25s', fast: '14s' }

const HERO_GRID_COLS = {
  '1x3':    'grid-cols-2 sm:grid-cols-3',
  '2x2':    'grid-cols-2',
  '1x4':    'grid-cols-2 sm:grid-cols-4',
  '2x3':    'grid-cols-2 sm:grid-cols-3',
  'scroll': '',
}
const HERO_GRID_MAX = { '1x3': 3, '2x2': 4, '1x4': 4, '2x3': 6, 'scroll': 8 }

export default function CmsDealGrid({ config }) {
  const theme   = config.section_theme ?? 'white'
  const palette = TEXT_PALETTE[theme] ?? TEXT_PALETTE.white
  const bgClass = theme === 'custom' ? '' : SECTION_BG[theme]
  const bgStyle = theme === 'custom' ? { background: config.bg_color } : {}
  const accent  = config.accent_color || '#ef4444'

  const cols         = config.columns ?? 4
  const layout       = config.layout ?? 'grid'
  const scrollStyle  = config.scroll_style ?? 'default'
  const headingAlign = config.heading_align ?? 'left'
  const timerAlign   = config.timer_align   ?? 'left'
  const headingColor = config.heading_color || null
  const timerColor   = config.timer_color   || accent
  const timerBottom  = config.timer_enabled && config.timer_position === 'bottom'
  const timerTop     = config.timer_enabled && !timerBottom

  const maxItems = config.max_items ?? (layout === 'scroll' ? 6 : cols * 2)
  const [products, setProducts] = useState([])

  useEffect(() => {
    const sort = LOGIC_SORT[config.logic] ?? 'popular'
    productsApi.list({ sort, limit: maxItems + 1 })
      .then(data => setProducts((data?.rows ?? []).slice(0, maxItems).map(toCardShape)))
      .catch(() => {})
  }, [config.logic, maxItems])

  const cardProps = {
    palette,
    showDiscount: config.show_discount_badge,
    showOriginal: config.show_original_price,
    showRatings:  config.show_ratings,
    showSold:     config.show_sold_count,
    accent,
  }

  const headingAlignClass = headingAlign === 'center' ? 'text-center' : headingAlign === 'right' ? 'text-right' : 'text-left'
  const timerJustifyClass = timerAlign === 'center' ? 'justify-center' : timerAlign === 'right' ? 'justify-end' : 'justify-start'

  const timerWidget = (color) => (
    <div className={['flex items-center gap-2', timerJustifyClass].join(' ')}>
      <span className={['text-xs font-semibold', color].join(' ')}>{config.timer_label || 'Ends in'}</span>
      <CountdownTimer config={config} color={timerColor} />
    </div>
  )

  // ── Hero mode ──────────────────────────────────────────────────────────────
  if (config.hero_enabled) {
    const heroGrid     = config.hero_grid ?? '1x3'
    const isScroll     = heroGrid === 'scroll'
    const heroMax      = HERO_GRID_MAX[heroGrid] ?? 3
    const heroProducts = products.slice(0, heroMax)
    const lightText    = config.hero_text_color !== 'dark'
    const textCls      = lightText ? 'text-white' : 'text-slate-900'
    const subCls       = lightText ? 'text-white/80' : 'text-slate-700'
    const overlayOpacity = (config.hero_overlay_opacity ?? 50) / 100

    const heroBgStyle =
      config.hero_bg_type === 'image' && config.hero_bg_image
        ? { backgroundImage: `url(${config.hero_bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: config.hero_bg_color || '#1e293b' }

    const heroCardPalette = {
      ...palette,
      card: 'bg-white/90 border border-white/20',
      name: 'text-slate-700',
      og:   'text-slate-400',
    }

    const inner = (
      <div className="relative overflow-hidden rounded-2xl" style={heroBgStyle}>
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Heading */}
          <div className={['mb-4', headingAlignClass].join(' ')}>
            {config.promo_text && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full mb-2" style={{ backgroundColor: accent }}>
                {config.promo_text}
              </span>
            )}
            <h2 className={['text-xl sm:text-2xl font-extrabold', !headingColor && textCls].join(' ')}
              style={headingColor ? { color: headingColor } : undefined}>
              {config.heading}
            </h2>
            {config.subheading && (
              <p className={['text-sm mt-0.5', subCls].join(' ')}>{config.subheading}</p>
            )}
            {config.show_view_all && (
              <a href="#" className="inline-block mt-1 text-sm font-semibold transition" style={{ color: accent }}>
                View All &rarr;
              </a>
            )}
          </div>

          {/* Timer top */}
          {timerTop && <div className="mb-6">{timerWidget(subCls)}</div>}

          {/* Products or redirect CTA */}
          {config.hero_show_products !== false ? (
            isScroll ? (
              <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-2">
                {heroProducts.map((p) => (
                  <div key={p.id} className="flex-shrink-0 w-36 sm:w-44">
                    <DealCard product={p} {...cardProps} palette={heroCardPalette} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={['grid gap-y-4 gap-x-3 sm:gap-4', HERO_GRID_COLS[heroGrid]].join(' ')}>
                {heroProducts.map((p) => (
                  <DealCard key={p.id} product={p} {...cardProps} palette={heroCardPalette} />
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className={['text-sm font-semibold opacity-70', textCls].join(' ')}>
                Tap to explore &rarr;
              </span>
            </div>
          )}

          {/* Timer bottom */}
          {timerBottom && <div className="mt-6">{timerWidget(subCls)}</div>}
        </div>
      </div>
    )

    // Wrap in anchor when no products and redirect_path is set
    if (config.hero_show_products === false && config.redirect_path) {
      return (
        <section className="py-8">
          <a href={config.redirect_path} className="block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {inner}
          </a>
        </section>
      )
    }

    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {inner}
        </div>
      </section>
    )
  }

  // ── Normal mode ────────────────────────────────────────────────────────────
  return (
    <section className={['py-8', bgClass].join(' ')} style={bgStyle}>
      {layout === 'marquee' && (
        <style>{`@keyframes karto-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading block — independently aligned */}
        <div className={['mb-3', headingAlignClass].join(' ')}>
          {config.promo_text && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full mb-2" style={{ backgroundColor: accent }}>
              {config.promo_text}
            </span>
          )}
          <h2 className={['text-xl sm:text-2xl font-extrabold', !headingColor && palette.title].join(' ')}
            style={headingColor ? { color: headingColor } : undefined}>
            {config.heading}
          </h2>
          {config.subheading && (
            <p className={['text-sm mt-0.5', palette.sub].join(' ')}>{config.subheading}</p>
          )}
          {config.show_view_all && (
            <a href="#" className="inline-block mt-1 text-sm font-semibold transition" style={{ color: accent }}>
              View All &rarr;
            </a>
          )}
        </div>

        {/* Timer — top, independently aligned */}
        {timerTop && <div className="mb-6">{timerWidget(palette.sub)}</div>}

        {/* scroll */}
        {layout === 'scroll' && (() => {
          const scrollWrapCls =
            scrollStyle === 'boxed'    ? `rounded-2xl p-4 ${palette.card}` :
            scrollStyle === 'elevated' ? 'bg-white rounded-2xl shadow-lg border border-slate-100 p-4' :
            scrollStyle === 'outlined' ? 'border-2 border-slate-200 rounded-2xl p-4' :
            ''
          return (
            <div className={scrollWrapCls}>
              <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar pb-2">
                {products.map((p) => (
                  <div key={p.id} className="flex-shrink-0 w-36 sm:w-44">
                    <DealCard product={p} {...cardProps} />
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* marquee — continuous CSS animation */}
        {layout === 'marquee' && (
          <div
            className="overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}
          >
            <div
              className="flex gap-4"
              style={{
                width: 'max-content',
                animation: `karto-marquee ${MARQUEE_SPEED[config.scroll_speed] ?? '25s'} linear infinite`,
              }}
            >
              {[...products, ...products].map((p, i) => (
                <div key={i} className="flex-shrink-0 w-44">
                  <DealCard product={p} {...cardProps} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* grid */}
        {layout === 'grid' && (
          <div className={['grid gap-y-4 gap-x-3 sm:gap-4', GRID_COLS[cols] ?? GRID_COLS[4]].join(' ')}>
            {products.map((p) => (
              <DealCard key={p.id} product={p} {...cardProps} />
            ))}
          </div>
        )}

        {/* Timer — bottom, independently aligned */}
        {timerBottom && <div className="mt-6">{timerWidget(palette.sub)}</div>}
      </div>
    </section>
  )
}
