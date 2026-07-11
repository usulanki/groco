import { memo, useState, useEffect, useRef } from 'react'
import { productsApi } from '../../lib/api'

// ─── Data helpers ─────────────────────────────────────────────────────────────

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const SOURCE_SORT = {
  trending:       'popular',
  deals:          'popular',
  'best-sellers': 'popular',
  'new-arrivals': 'newest',
  category:       'popular',
  manual:         'popular',
}

function toCardShape(p) {
  const price   = p.prices?.[0]
  const primary = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
  const img     = primary?.path
    ? `${MEDIA_BASE}${primary.path}`
    : `https://placehold.co/300x300/e2e8f0/94a3b8?text=${encodeURIComponent(p.name ?? '')}`
  return {
    id:    p.id,
    slug:  p.slug,
    name:  p.name,
    img,
    price: price ? Number(price.final_price ?? price.price) : 0,
  }
}

async function fetchPanelProducts(panel) {
  const sort       = SOURCE_SORT[panel.source] ?? 'popular'
  const params     = { sort, limit: 4 }
  if (panel.source === 'category' && panel.category_id) params.category_id = panel.category_id

  try {
    const data = await productsApi.list(params)
    const rows = data?.rows ?? []
    if (rows.length > 0) return rows.map(toCardShape)
  } catch {}

  // Fallback: any products
  try {
    const fallback = await productsApi.list({ limit: 4 })
    return (fallback?.rows ?? []).map(toCardShape)
  } catch {}

  return []
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProductMini({ p }) {
  return (
    <div className="bg-white/80 rounded-xl overflow-hidden flex flex-col items-center p-1">
      {p.img
        ? <img src={p.img} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-0.5" />
        : <div className="w-full aspect-square bg-slate-100 rounded-lg mb-0.5" />
      }
      <p className="text-[9px] sm:text-[11px] font-semibold text-slate-800 line-clamp-1 text-center w-full">{p.name}</p>
      {p.price > 0 && <p className="text-[9px] sm:text-[11px] font-bold text-orange-500">₹{p.price.toLocaleString('en-IN')}</p>}
    </div>
  )
}

function SeeMoreBtn({ panel }) {
  if (!panel.see_more_enabled) return null
  const label = panel.see_more_label || 'See More'
  const style = panel.see_more_style ?? 'text-arrow'
  const href  = panel.link || '#'

  if (style === 'button-filled') {
    return (
      <a href={href} className="block text-center text-xs font-bold text-white bg-slate-800 rounded-lg py-1 px-3 hover:bg-slate-700 transition">
        {label}
      </a>
    )
  }
  if (style === 'button-outline') {
    return (
      <a href={href} className="block text-center text-xs font-bold text-slate-800 border border-slate-800 rounded-lg py-1 px-3 hover:bg-slate-100 transition">
        {label}
      </a>
    )
  }
  // text variants
  return (
    <a href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition">
      {label}
      {style === 'text-arrow'   && <span>→</span>}
      {style === 'text-chevron' && <span>›</span>}
    </a>
  )
}

const ARROW_CLS = {
  circle:           'rounded-full bg-white shadow hover:bg-slate-50 text-slate-700',
  square:           'rounded-md bg-white shadow hover:bg-slate-50 text-slate-700',
  'square-sharp':   'rounded-none bg-white shadow hover:bg-slate-50 text-slate-700',
  rectangle:        'rounded-md bg-white shadow hover:bg-slate-50 text-slate-700',
  'rectangle-sharp':'rounded-none bg-white shadow hover:bg-slate-50 text-slate-700',
  minimal:          'rounded-full bg-black/20 hover:bg-black/40 text-white',
  none:             'hidden',
}
const ARROW_SIZE = {
  circle:           'w-9 h-9',
  square:           'w-9 h-9',
  'square-sharp':   'w-9 h-9',
  rectangle:        'w-6 h-11',
  'rectangle-sharp':'w-6 h-11',
  minimal:          'w-9 h-9',
  none:             'w-0',
}

const PANEL_RADIUS = {
  none: 'rounded-none',
  sm:   'rounded-lg',
  md:   'rounded-xl',
  lg:   'rounded-2xl',
  xl:   'rounded-3xl',
}

const PanelCard = memo(function PanelCard({ panel, defaultBgColor, defaultBgOpacity, radius }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchPanelProducts(panel).then(setProducts)
  }, [panel.source, panel.category_id])

  const href      = panel.link || '#'
  const radiusCls = PANEL_RADIUS[radius ?? 'lg']
  const bgColor   = panel.bg_color  || defaultBgColor  || '#ffffff'
  const opacity   = ((panel.opacity  ?? defaultBgOpacity) ?? 95) / 100
  const textColor = panel.text_color || '#0f172a'

  return (
    <a href={href} className={['relative block shadow-md hover:shadow-lg transition-shadow h-full', radiusCls].join(' ')}>
      <div className={['overflow-hidden h-full flex flex-col', radiusCls].join(' ')}>
        {/* Bg layer with per-panel color + opacity */}
        <div className={['absolute inset-0', radiusCls].join(' ')} style={{ backgroundColor: bgColor, opacity }} />
        {/* Content layer */}
        <div className="relative flex flex-col h-full p-2 sm:p-4 gap-1.5 sm:gap-2">
          {/* See-more top */}
          {panel.see_more_position === 'top' && <SeeMoreBtn panel={panel} />}
          {/* Heading */}
          <p className="text-sm font-bold leading-tight" style={{ color: textColor }}>{panel.heading}</p>
          {/* Products */}
          {products.length === 0 ? (
            <div className="flex-1 grid grid-cols-2 gap-1">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white/60 rounded-xl animate-pulse h-14 sm:h-20" />
              ))}
            </div>
          ) : panel.content_type === '1-item' ? (
            <div className="flex-1">
              <div className="bg-white/80 rounded-xl overflow-hidden flex flex-col items-center p-1.5 sm:p-2 h-full">
                {products[0]?.img
                  ? <img src={products[0].img} alt={products[0].name} className="w-full aspect-square object-cover rounded-lg mb-1" />
                  : <div className="w-full aspect-square bg-slate-100 rounded-lg mb-1" />
                }
                <p className="text-[10px] sm:text-xs font-semibold text-slate-800 line-clamp-1 text-center">{products[0]?.name}</p>
                {products[0]?.price > 0 && (
                  <p className="text-[10px] sm:text-xs font-bold text-orange-500">₹{products[0].price.toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          ) : panel.content_type === '2-items' ? (
            <div className="grid grid-cols-2 gap-1 flex-1">
              {products.slice(0, 2).map(p => <ProductMini key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 flex-1">
              {products.slice(0, 4).map(p => <ProductMini key={p.id} p={p} />)}
            </div>
          )}
          {/* See-more bottom */}
          {(panel.see_more_position === 'bottom' || !panel.see_more_position) && <SeeMoreBtn panel={panel} />}
        </div>
      </div>
    </a>
  )
})

// ─── Arrow button ─────────────────────────────────────────────────────────────

function ArrowBtn({ direction, arrowStyle, onClick }) {
  const style = arrowStyle ?? 'circle'
  const cls = ['flex items-center justify-center transition-all focus:outline-none', ARROW_CLS[style] ?? ARROW_CLS.circle, ARROW_SIZE[style] ?? ARROW_SIZE.circle].join(' ')
  return (
    <button onClick={onClick} className={cls} aria-label={direction === 'prev' ? 'Previous' : 'Next'}>
      {direction === 'prev'
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      }
    </button>
  )
}

// ─── Dots ─────────────────────────────────────────────────────────────────────

function Dots({ count, current, style, onClick }) {
  if (count <= 1) return null
  return (
    <div className="flex justify-center items-center gap-1.5 py-2">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === current
        if (style === 'pill') return (
          <button key={i} onClick={() => onClick(i)} aria-label={`Slide ${i + 1}`}
            className={['rounded-full h-2 transition-all duration-300', active ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'].join(' ')} />
        )
        if (style === 'line') return (
          <button key={i} onClick={() => onClick(i)} aria-label={`Slide ${i + 1}`}
            className={['h-0.5 rounded-full transition-all duration-300', active ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'].join(' ')} />
        )
        if (style === 'numbered') return (
          <button key={i} onClick={() => onClick(i)} aria-label={`Slide ${i + 1}`}
            className={['w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all', active ? 'bg-white text-slate-800' : 'bg-white/30 text-white hover:bg-white/50'].join(' ')}>
            {i + 1}
          </button>
        )
        // default: circle
        return (
          <button key={i} onClick={() => onClick(i)} aria-label={`Slide ${i + 1}`}
            className={['rounded-full transition-all duration-300', active ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'].join(' ')} />
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CmsSlidingBanner({ config }) {
  const slides     = config.slides ?? []
  const allPanels  = config.panels ?? []
  const panelCount = Math.min(Math.max(allPanels.length, config.panels_count ?? 3), 4)
  const panels     = allPanels.slice(0, panelCount)
  const [current, setCurrent] = useState(0)
  const paused      = useRef(false)
  const touchStartX = useRef(null)
  const total       = slides.length

  const multiSlide  = slides.length > 1
  const showArrows  = multiSlide && config.arrow_style !== 'none' && (config.nav_style === 'arrows' || config.nav_style === 'both')
  const showDots    = multiSlide && (config.nav_style === 'dots' || config.nav_style === 'both')
  const sidesPos    = (config.arrow_position ?? 'sides') === 'sides'
  const onHover     = config.arrow_on_hover ?? false
  const isAuto      = config.scroll_behavior === 'auto' || config.scroll_behavior === 'auto-pause'

  // Auto-advance
  useEffect(() => {
    if (!isAuto || total <= 1) return
    const ms = (config.scroll_interval ?? 4) * 1000
    const t = setInterval(() => {
      if (!paused.current) setCurrent(c => (c + 1) % total)
    }, ms)
    return () => clearInterval(t)
  }, [isAuto, config.scroll_interval, total])

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) prev()
    else if (dx < -50) next()
    touchStartX.current = null
  }

  // Mobile: max 2 cols; sm+: full panel count
  const colClass =
    panelCount >= 4 ? 'grid-cols-2 sm:grid-cols-4' :
    panelCount === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2'

  if (slides.length === 0 && panels.length === 0) return null

  // Helper: build per-slide background style
  function slideBg(s) {
    if (s.bg_type === 'image' && s.bg_image)
      return {
        backgroundImage:    `url(${s.bg_image})`,
        backgroundSize:     '100% auto',
        backgroundPosition: 'top center',
        backgroundRepeat:   'no-repeat',
        backgroundColor:    s.bg_color ?? '#ffffff',
      }
    if (s.bg_type === 'color') return { backgroundColor: s.bg_color ?? '#ffffff' }
    return { background: `linear-gradient(135deg, ${s.bg_from ?? '#ffffff'}, ${s.bg_to ?? '#ffffff'})` }
  }

  // Section bg = white so panels below always sit on a white base
  const currentSlide = slides[current] ?? {}
  const sectionBg =
    currentSlide.bg_type === 'color'
      ? { backgroundColor: currentSlide.bg_color ?? '#ffffff', transition: 'background-color 600ms ease' }
      : { backgroundColor: '#ffffff' }

  return (
    <section
      style={sectionBg}
      onMouseEnter={() => { if (config.scroll_behavior === 'auto-pause') paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* ── Slide track — overflow hidden clips the sliding track ── */}
      <div
        className={['relative overflow-hidden min-h-[200px] sm:min-h-[320px]', onHover ? 'group' : ''].join(' ')}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* Sliding track: all slides in a flex row, translateX moves between them */}
        <div
          className="flex h-full"
          style={{
            transform:  `translateX(-${current * 100}%)`,
            transition: 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          {slides.map((s, i) => {
            const textAlignCls = {
              left:   'items-start text-left',
              center: 'items-center text-center',
              right:  'items-end text-right',
            }[s.text_position ?? 'left'] ?? 'items-start text-left'

            return (
              <div
                key={i}
                className="relative w-full flex-shrink-0 flex flex-col min-h-[200px] sm:min-h-[320px]"
                style={slideBg(s)}
              >
                {/* Overlay */}
                {s.overlay_enabled && (s.overlay_opacity ?? 0) > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: `rgba(0,0,0,${(s.overlay_opacity ?? 0) / 100})` }}
                  />
                )}
                {/* Fade-to-white at the bottom for image slides */}
                {s.bg_type === 'image' && s.bg_image && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
                  />
                )}
                {/* Text */}
                {s.text_enabled !== false && (s.heading || s.subheading) && (
                  <div className={['relative z-10 flex flex-col px-4 pt-4 pb-1 sm:px-6 sm:pt-6 sm:pb-2', textAlignCls].join(' ')}>
                    {s.heading && (
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
                        {s.heading}
                      </h2>
                    )}
                    {s.subheading && (
                      <p className="text-white/80 text-sm sm:text-base mt-1 drop-shadow">
                        {s.subheading}
                      </p>
                    )}
                  </div>
                )}
                {/* Spacer — on mobile needs extra room for the deep panel overlap */}
                <div className="flex-1 min-h-[96px] sm:min-h-[120px]" />
              </div>
            )
          })}
        </div>

        {/* Dots — absolutely positioned at bottom of slide area */}
        {showDots && (
          <div className="absolute bottom-2 left-0 right-0 z-10">
            <Dots count={total} current={current} style={config.dots_style ?? 'circle'} onClick={setCurrent} />
          </div>
        )}

        {/* Slide counter */}
        {config.show_slide_counter && total > 1 && (
          <div className="absolute bottom-2 right-4 z-10 bg-black/40 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {current + 1} / {total}
          </div>
        )}

        {/* Side arrows — hidden on mobile (swipe to navigate) */}
        {showArrows && sidesPos && (
          <>
            <div className={['hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 transition-opacity', onHover ? 'opacity-0 group-hover:opacity-100' : ''].join(' ')}>
              <ArrowBtn direction="prev" arrowStyle={config.arrow_style ?? 'circle'} onClick={prev} />
            </div>
            <div className={['hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 transition-opacity', onHover ? 'opacity-0 group-hover:opacity-100' : ''].join(' ')}>
              <ArrowBtn direction="next" arrowStyle={config.arrow_style ?? 'circle'} onClick={next} />
            </div>
          </>
        )}

        {/* Corner arrows — hidden on mobile */}
        {showArrows && !sidesPos && (
          <div className={['hidden sm:flex absolute bottom-3 right-3 z-20 gap-1.5 transition-opacity', onHover ? 'opacity-0 group-hover:opacity-100' : ''].join(' ')}>
            <ArrowBtn direction="prev" arrowStyle={config.arrow_style ?? 'circle'} onClick={prev} />
            <ArrowBtn direction="next" arrowStyle={config.arrow_style ?? 'circle'} onClick={next} />
          </div>
        )}
      </div>

      {/* ── Panels — overlap the bottom of the slider ── */}
      {panels.length > 0 && (
        <div style={{ transform: 'translateZ(0)', willChange: 'transform' }} className={['-mt-24 sm:-mt-14 relative z-10 grid gap-2 sm:gap-3 px-3 sm:px-12 pb-4 sm:pb-6', colClass].join(' ')}>
          {panels.map(panel => (
            <PanelCard
              key={panel.id}
              panel={panel}
              defaultBgColor={config.panel_bg_color}
              defaultBgOpacity={config.panel_bg_opacity}
              radius={config.panel_radius}
            />
          ))}
        </div>
      )}
    </section>
  )
}
