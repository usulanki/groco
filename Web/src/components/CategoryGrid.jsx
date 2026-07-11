import { useState, useEffect, useCallback, useRef } from 'react'
import { categoriesApi } from '../lib/api'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

// Slug → { emoji, color, textColor } mapping for known categories.
// Unknown categories fall back to a cycling palette.
const CATEGORY_STYLE = {
  fashion:        { emoji: '👗', color: 'bg-pink-100',    textColor: 'text-pink-700' },
  mobiles:        { emoji: '📱', color: 'bg-blue-100',    textColor: 'text-blue-700' },
  beauty:         { emoji: '💄', color: 'bg-rose-100',    textColor: 'text-rose-700' },
  electronics:    { emoji: '💻', color: 'bg-indigo-100',  textColor: 'text-indigo-700' },
  home:           { emoji: '🏠', color: 'bg-amber-100',   textColor: 'text-amber-700' },
  appliances:     { emoji: '🔌', color: 'bg-slate-100',   textColor: 'text-slate-700' },
  'baby-products':{ emoji: '👶', color: 'bg-yellow-100',  textColor: 'text-yellow-700' },
  sports:         { emoji: '⚽', color: 'bg-green-100',   textColor: 'text-green-700' },
  automotive:     { emoji: '🚗', color: 'bg-slate-100',   textColor: 'text-slate-700' },
}

const FALLBACK_PALETTE = [
  { emoji: '🛍️', color: 'bg-purple-100',  textColor: 'text-purple-700' },
  { emoji: '⭐',  color: 'bg-green-100',   textColor: 'text-green-700' },
  { emoji: '🎁',  color: 'bg-teal-100',    textColor: 'text-teal-700' },
  { emoji: '🔥',  color: 'bg-orange-100',  textColor: 'text-orange-700' },
]

function getCategoryStyle(slug, index) {
  return CATEGORY_STYLE[slug] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
}

// Column class maps — full strings so Tailwind doesn't purge them
const CIRCLE_COLS = {
  4:  'grid-cols-2 sm:grid-cols-4',
  6:  'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
  8:  'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8',
  9:  'grid-cols-3 sm:grid-cols-5 lg:grid-cols-9',
  10: 'grid-cols-2 sm:grid-cols-5 lg:grid-cols-10',
}
const CARD_COLS = {
  4:  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  6:  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  8:  'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8',
  9:  'grid-cols-3 sm:grid-cols-5 lg:grid-cols-9',
  10: 'grid-cols-2 sm:grid-cols-5 lg:grid-cols-10',
}

// ─── useHover hook ─────────────────────────────────────────────────────────────
function useHover() {
  const [hoveredId, setHoveredId] = useState(null)
  const onEnter = useCallback((id) => setHoveredId(id), [])
  const onLeave = useCallback(() => setHoveredId(null), [])
  return { hoveredId, onEnter, onLeave }
}

// ─── Layout: Circle ────────────────────────────────────────────────────────────
function CircleLayout({ categories, columns = 8, nameColor, nameBold, hover, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  return (
    <div className={isSlider ? 'flex gap-5' : `grid ${CIRCLE_COLS[columns] ?? CIRCLE_COLS[8]} gap-3`}>
      {categories.map((cat, i) => {
        const { emoji } = getCategoryStyle(cat.slug, i)
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`flex flex-col items-center gap-2.5 transition-all duration-200${isSlider ? ' flex-shrink-0 w-24' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              transform: hov
                ? hover.scale ? 'scale(1.08)' : hover.lift ? 'translateY(-6px)' : undefined
                : undefined,
            }}
          >
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden transition-all duration-200"
              style={{
                background: hov && hover.bgColor ? hover.bgColor : undefined,
                boxShadow: hov && hover.shadow ? '0 8px 24px rgba(0,0,0,0.14)' : undefined,
                outline: hov && hover.borderColor ? `2px solid ${hover.borderColor}` : undefined,
              }}
            >
              {cat.media?.path ? (
                <img
                  src={`${MEDIA_BASE}${cat.media.path}`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: hov && hover.imageZoom ? 'scale(1.12)' : undefined }}
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl sm:text-4xl">
                  {emoji}
                </div>
              )}
            </div>
            <span
              className={`text-xs text-center transition-colors duration-200 ${nameBold ? 'font-bold' : 'font-semibold'}`}
              style={{ color: hov && hover.textColor ? hover.textColor : nameColor ?? '#374151' }}
            >
              {cat.name}
            </span>
          </a>
        )
      })}
    </div>
  )
}

// ─── Layout: Card ──────────────────────────────────────────────────────────────
function CardLayout({ categories, columns = 4, nameColor, nameBold, hover, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  return (
    <div className={isSlider ? 'flex gap-4' : `grid ${CARD_COLS[columns] ?? CARD_COLS[4]} gap-4`}>
      {categories.map((cat, i) => {
        const { emoji, color, textColor } = getCategoryStyle(cat.slug, i)
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`rounded-2xl overflow-hidden border transition-all duration-200${isSlider ? ' flex-shrink-0 w-44' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              borderColor: hov && hover.borderColor ? hover.borderColor : '#f3f4f6',
              boxShadow: hov && hover.shadow ? '0 8px 24px rgba(0,0,0,0.14)' : '0 1px 3px rgba(0,0,0,0.06)',
              transform: hov
                ? hover.scale ? 'scale(1.04)' : hover.lift ? 'translateY(-6px)' : undefined
                : undefined,
            }}
          >
            <div className={`relative h-32 sm:h-40 ${color} flex items-center justify-center overflow-hidden`}>
              {cat.media?.path ? (
                <img
                  src={`${MEDIA_BASE}${cat.media.path}`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: hov && hover.imageZoom ? 'scale(1.1)' : undefined }}
                />
              ) : (
                <span className="text-5xl sm:text-6xl">{emoji}</span>
              )}
              {hov && hover.overlay && (
                <div
                  className="absolute inset-0 transition-opacity duration-200"
                  style={{ background: hover.overlayColor, opacity: hover.overlayOpacity / 100 }}
                />
              )}
            </div>
            <div
              className="px-4 py-3 transition-colors duration-200"
              style={{ background: hov && hover.bgColor ? hover.bgColor : 'white' }}
            >
              <p
                className={`text-sm transition-colors duration-200 ${nameBold ? 'font-bold' : 'font-semibold'} ${nameColor || (hov && hover.textColor) ? '' : textColor}`}
                style={{ color: hov && hover.textColor ? hover.textColor : nameColor ?? undefined }}
              >
                {cat.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Shop now &rarr;</p>
            </div>
          </a>
        )
      })}
    </div>
  )
}

// ─── Layout: Pill ──────────────────────────────────────────────────────────────
function PillLayout({ categories, nameColor, nameBold, hover, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  return (
    <div className={isSlider ? 'flex gap-3' : 'flex flex-wrap gap-3'}>
      {categories.map((cat, i) => {
        const { emoji, color } = getCategoryStyle(cat.slug, i)
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full ${color} ${nameBold ? 'font-bold' : 'font-semibold'} text-sm transition-all duration-200${isSlider ? ' flex-shrink-0' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              color: hov && hover.textColor ? hover.textColor : nameColor ?? undefined,
              background: hov && hover.bgColor ? hover.bgColor : undefined,
              boxShadow: hov && hover.shadow ? '0 6px 16px rgba(0,0,0,0.12)' : undefined,
              outline: hov && hover.borderColor ? `2px solid ${hover.borderColor}` : undefined,
              transform: hov
                ? hover.scale ? 'scale(1.06)' : hover.lift ? 'translateY(-4px)' : undefined
                : undefined,
            }}
          >
            <span className="text-lg leading-none">{emoji}</span>
            {cat.name}
          </a>
        )
      })}
    </div>
  )
}

// ─── Layout: Minimal ───────────────────────────────────────────────────────────
function MinimalLayout({ categories, columns = 8, nameColor, nameBold, hover, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  return (
    <div className={isSlider ? 'flex gap-4' : `grid ${CIRCLE_COLS[columns] ?? CIRCLE_COLS[8]} gap-3`}>
      {categories.map((cat, i) => {
        const { emoji } = getCategoryStyle(cat.slug, i)
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`flex flex-col items-center gap-2 rounded-xl p-1 transition-all duration-200${isSlider ? ' flex-shrink-0 w-20' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              background: hov && hover.bgColor ? hover.bgColor : undefined,
              boxShadow: hov && hover.shadow ? '0 6px 16px rgba(0,0,0,0.12)' : undefined,
              outline: hov && hover.borderColor ? `2px solid ${hover.borderColor}` : undefined,
              transform: hov
                ? hover.scale ? 'scale(1.08)' : hover.lift ? 'translateY(-6px)' : undefined
                : undefined,
            }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-xl">
              {cat.media?.path ? (
                <img
                  src={`${MEDIA_BASE}${cat.media.path}`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: hov && hover.imageZoom ? 'scale(1.12)' : undefined }}
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-4xl">{emoji}</span>
              )}
            </div>
            <span
              className={`text-xs text-center transition-colors duration-200 ${nameBold ? 'font-bold' : 'font-semibold'}`}
              style={{ color: hov && hover.textColor ? hover.textColor : nameColor ?? '#374151' }}
            >
              {cat.name}
            </span>
          </a>
        )
      })}
    </div>
  )
}

// ─── Layout: Banner ────────────────────────────────────────────────────────────
function BannerLayout({ categories, hover, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  return (
    <div className={isSlider ? 'flex gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
      {categories.map((cat, i) => {
        const { emoji, color } = getCategoryStyle(cat.slug, i)
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`relative rounded-2xl overflow-hidden h-28 sm:h-36 transition-all duration-200${isSlider ? ' flex-shrink-0 w-64' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              boxShadow: hov && hover.shadow ? '0 10px 28px rgba(0,0,0,0.18)' : undefined,
              outline: hov && hover.borderColor ? `2px solid ${hover.borderColor}` : undefined,
              transform: hov && hover.lift ? 'translateY(-6px)' : undefined,
            }}
          >
            {cat.media?.path ? (
              <img
                src={`${MEDIA_BASE}${cat.media.path}`}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: hov && hover.imageZoom ? 'scale(1.08)' : undefined }}
              />
            ) : (
              <div className={`w-full h-full ${color} flex items-center justify-end pr-8`}>
                <span className="text-7xl opacity-60">{emoji}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent flex items-center pl-6">
              {hov && hover.overlay && (
                <div
                  className="absolute inset-0"
                  style={{ background: hover.overlayColor, opacity: hover.overlayOpacity / 100 }}
                />
              )}
              <div className="relative z-10">
                <p
                  className="font-bold text-lg sm:text-xl leading-tight transition-colors duration-200"
                  style={{ color: hov && hover.textColor ? hover.textColor : 'white' }}
                >
                  {cat.name}
                </p>
                <p className="text-white/75 text-xs mt-1 font-medium">
                  Explore collection &rarr;
                </p>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}

// ─── Border radius map for Text layout ────────────────────────────────────────
const BORDER_RADIUS_PX = { none: '0px', sm: '6px', md: '10px', lg: '16px', full: '9999px' }

// ─── Layout: Text ──────────────────────────────────────────────────────────────
function TextLayout({ categories, nameColor, nameBold, hover, borderColor, borderRadius, isSlider }) {
  const { hoveredId, onEnter, onLeave } = useHover()
  const radius = BORDER_RADIUS_PX[borderRadius] ?? BORDER_RADIUS_PX.md
  return (
    <div className={isSlider ? 'flex gap-3' : 'flex flex-wrap gap-3'}>
      {categories.map((cat) => {
        const hov = hoveredId === cat.id
        return (
          <a
            key={cat.id}
            href={`/category/${cat.slug}`}
            onMouseEnter={() => onEnter(cat.id)}
            onMouseLeave={onLeave}
            className={`inline-flex items-center px-4 py-2 border transition-all duration-200 text-sm${isSlider ? ' flex-shrink-0' : ''}`}
            style={{
              scrollSnapAlign: isSlider ? 'start' : undefined,
              borderRadius: radius,
              borderColor: hov && hover.borderColor ? hover.borderColor : borderColor ?? '#e2e8f0',
              color: hov && hover.textColor ? hover.textColor : nameColor ?? '#374151',
              fontWeight: nameBold ? 700 : 600,
              background: hov && hover.bgColor ? hover.bgColor : 'transparent',
              boxShadow: hov && hover.shadow ? '0 4px 12px rgba(0,0,0,0.10)' : undefined,
              transform: hov
                ? hover.scale ? 'scale(1.05)' : hover.lift ? 'translateY(-4px)' : undefined
                : undefined,
            }}
          >
            {cat.name}
          </a>
        )
      })}
    </div>
  )
}

// ─── Slider arrow button (module-level to avoid recreation on each render) ─────
function SliderArrowBtn({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-lg transition-all duration-150"
      style={{ [dir === -1 ? 'left' : 'right']: '-18px' }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={dir === -1 ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}

// ─── Slider wrapper ────────────────────────────────────────────────────────────
function SliderWrapper({ children, showArrows, autoplay, speed }) {
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect() }
  }, [updateArrows])

  useEffect(() => {
    if (!autoplay) return
    const ms = (speed ?? 3) * 1000
    const id = setInterval(() => {
      const el = scrollRef.current
      if (!el) return
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: Math.round(el.clientWidth * 0.6), behavior: 'smooth' })
      }
    }, ms)
    return () => clearInterval(id)
  }, [autoplay, speed])

  const scroll = (dir) => {
    const el = scrollRef.current
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {showArrows && canLeft  && <SliderArrowBtn dir={-1} onClick={() => scroll(-1)} />}
      <style>{`.karto-slider::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={scrollRef}
        className="karto-slider flex gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>
      {showArrows && canRight && <SliderArrowBtn dir={1} onClick={() => scroll(1)} />}
    </div>
  )
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────
const SKELETONS = {
  circle: (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="w-14 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  ),
  card: (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
          <div className="h-32 sm:h-40 bg-gray-200" />
          <div className="px-4 py-3 bg-white space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-2 w-16 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  ),
  pill: (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-10 w-28 bg-gray-200 rounded-full animate-pulse" />
      ))}
    </div>
  ),
  banner: (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 sm:h-36 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  ),
  minimal: (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
          <div className="w-14 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  ),
  text: (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-9 bg-gray-200 rounded-lg animate-pulse" style={{ width: `${60 + (i % 3) * 20}px` }} />
      ))}
    </div>
  ),
  slider: (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-24 flex-shrink-0 flex flex-col items-center gap-2 animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="w-14 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  ),
}

// ─── Layout switcher icons ─────────────────────────────────────────────────────
const LAYOUTS = [
  {
    key: 'circle',
    label: 'Circle',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="3" cy="8" r="2.5" />
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="13" cy="8" r="2.5" />
      </svg>
    ),
  },
  {
    key: 'card',
    label: 'Card',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'pill',
    label: 'Pill',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="2" width="14" height="4" rx="2" />
        <rect x="1" y="7" width="10" height="4" rx="2" />
        <rect x="1" y="12" width="12" height="4" rx="2" />
      </svg>
    ),
  },
  {
    key: 'banner',
    label: 'Banner',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="14" height="6" rx="1.5" />
        <rect x="1" y="9" width="14" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'minimal',
    label: 'Minimal',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="4" height="4" rx="1" />
        <rect x="6" y="2" width="4" height="4" rx="1" />
        <rect x="10" y="2" width="4" height="4" rx="1" />
        <rect x="2" y="10" width="4" height="1.5" rx="0.75" />
        <rect x="6" y="10" width="4" height="1.5" rx="0.75" />
        <rect x="10" y="10" width="4" height="1.5" rx="0.75" />
      </svg>
    ),
  },
  {
    key: 'text',
    label: 'Text',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="2" width="6" height="4" rx="1" />
        <rect x="8.5" y="2" width="6.5" height="4" rx="1" />
        <rect x="1" y="10" width="9" height="4" rx="1" />
        <rect x="11.5" y="10" width="3.5" height="4" rx="1" />
      </svg>
    ),
  },
]

const VISIBLE_COUNT = 8

// Maps see_more_icon values (set in Admin CMS) to inline SVGs
const SEE_MORE_ICONS = {
  'chevron-down': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  'chevron-up': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  'chevrons-down': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5 5-5M7 6l5 5 5-5" />
    </svg>
  ),
  'arrow-right': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  'arrow-down': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  'move-right': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M15 6l6 6-6 6" />
    </svg>
  ),
  'plus-circle': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8M8 12h8" />
    </svg>
  ),
}

const POSITION_ALIGN = {
  'bottom-center': 'flex justify-center',
  'bottom-left':   'flex justify-start',
  'bottom-right':  'flex justify-end',
}

export default function CategoryGrid({ cmsConfig = null }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [localLayout, setLocalLayout] = useState('circle') // used only when no cmsConfig

  // When cmsConfig is present always derive from it directly (no stale state)
  const layout       = cmsConfig ? cmsConfig.layout : localLayout

  const sectionBg    = cmsConfig?.section_bg_color   ?? '#ffffff'
  const title        = cmsConfig?.title             ?? 'Shop by Category'
  const titleColor   = cmsConfig?.title_color       ?? null
  const titleAlign   = cmsConfig?.title_align       ?? 'left'
  const nameColor    = cmsConfig?.name_color        ?? null
  const nameBold     = cmsConfig?.name_bold         ?? false
  const maxVisible   = cmsConfig?.max_visible        ?? VISIBLE_COUNT
  const columns          = cmsConfig?.columns              ?? 8
  const textBorderColor  = cmsConfig?.text_border_color    ?? '#e2e8f0'
  const textBorderRadius = cmsConfig?.text_border_radius   ?? 'md'
  const showAsSlider     = cmsConfig?.show_as_slider       ?? false
  const sliderAutoplay   = cmsConfig?.slider_autoplay      ?? false
  const sliderSpeed      = cmsConfig?.slider_speed         ?? 3
  const sliderArrows     = cmsConfig?.slider_arrows        !== false
  const showSeeMore  = cmsConfig ? cmsConfig.show_see_more : true
  const seeMoreLabel = cmsConfig?.see_more_label     || 'See More'
  const seeMoreIcon  = cmsConfig?.see_more_icon      ?? 'chevron-down'
  const position     = cmsConfig?.see_more_position  ?? 'bottom-center'
  const showText     = cmsConfig?.see_more_show_text !== false

  // Hover config — passed as one object to avoid prop explosion
  const hover = {
    scale:          cmsConfig?.hover_scale          ?? true,
    lift:           cmsConfig?.hover_lift           ?? false,
    shadow:         cmsConfig?.hover_shadow         ?? true,
    imageZoom:      cmsConfig?.hover_image_zoom     ?? false,
    textColor:      cmsConfig?.hover_text_color     ?? null,
    bgColor:        cmsConfig?.hover_bg_color       ?? null,
    borderColor:    cmsConfig?.hover_border_color   ?? null,
    overlay:        cmsConfig?.hover_overlay        ?? false,
    overlayColor:   cmsConfig?.hover_overlay_color  ?? '#000000',
    overlayOpacity: cmsConfig?.hover_overlay_opacity ?? 20,
  }

  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Sliders show all; pills and banners wrap naturally; others paginate
  const paginates = !showAsSlider && (layout === 'circle' || layout === 'card' || layout === 'minimal' || layout === 'text')
  const visible = paginates && !showAll ? categories.slice(0, maxVisible) : categories
  const hasMore = showSeeMore && paginates && categories.length > maxVisible

  const isTopPosition = position === 'top-right' || position === 'top-left'
  const alignClass    = POSITION_ALIGN[position] ?? 'flex justify-center'

  const nameProps = { nameColor, nameBold, hover }
  const textProps = { ...nameProps, borderColor: textBorderColor, borderRadius: textBorderRadius }

  // The see more / see less toggle button
  const SeeMoreButton = hasMore ? (
    <button
      onClick={() => setShowAll(v => !v)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition"
    >
      {showAll ? (
        <>
          {showText && <span>See Less</span>}
          {SEE_MORE_ICONS['chevron-up']}
        </>
      ) : (
        <>
          {showText && <span>{seeMoreLabel}</span>}
          {SEE_MORE_ICONS[seeMoreIcon] ?? SEE_MORE_ICONS['chevron-down']}
        </>
      )}
    </button>
  ) : null

  const headerClass =
    titleAlign === 'center' ? 'flex flex-col items-center gap-2' :
    titleAlign === 'right'  ? 'flex flex-row-reverse items-center justify-between' :
    'flex items-center justify-between'

  const titleClass =
    titleAlign === 'center' ? 'text-center' :
    titleAlign === 'right'  ? 'text-right' :
    'text-left'

  const layoutEl = (
    <>
      {layout === 'circle'  && <CircleLayout  categories={visible} columns={columns} {...nameProps} isSlider={showAsSlider} />}
      {layout === 'card'    && <CardLayout    categories={visible} columns={columns} {...nameProps} isSlider={showAsSlider} />}
      {layout === 'pill'    && <PillLayout    categories={visible} {...nameProps} isSlider={showAsSlider} />}
      {layout === 'banner'  && <BannerLayout  categories={visible} hover={hover} isSlider={showAsSlider} />}
      {layout === 'minimal' && <MinimalLayout categories={visible} columns={columns} {...nameProps} isSlider={showAsSlider} />}
      {layout === 'text'    && <TextLayout    categories={visible} {...textProps} isSlider={showAsSlider} />}
    </>
  )

  return (
    <section style={{ backgroundColor: sectionBg }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className={`${headerClass} mb-6`}>
        <h2
          className={`text-2xl font-bold ${titleClass}`}
          style={{ color: titleColor ?? '#0f172a' }}
        >
          {title}
        </h2>

        {/* Top-positioned see more button */}
        {isTopPosition && SeeMoreButton}

        {/* Layout switcher — hidden when layout is controlled by CMS */}
        {!cmsConfig && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {LAYOUTS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setLocalLayout(key); setShowAll(false) }}
                title={label}
                className={`p-1.5 rounded-md transition-all duration-150 ${
                  layout === key
                    ? 'bg-white text-brand-500 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (SKELETONS[showAsSlider ? 'slider' : layout] ?? SKELETONS.circle)}

      {error && (
        <div className="text-center py-10 text-sm text-red-500">
          Failed to load categories. Please try again later.
        </div>
      )}

      {!loading && !error && (
        <>
          {showAsSlider ? (
            <SliderWrapper showArrows={sliderArrows} autoplay={sliderAutoplay} speed={sliderSpeed}>
              {layoutEl}
            </SliderWrapper>
          ) : layoutEl}

          {/* Bottom-positioned see more button */}
          {!isTopPosition && SeeMoreButton && (
            <div className={`${alignClass} mt-6`}>
              {SeeMoreButton}
            </div>
          )}
        </>
      )}
    </div>
    </section>
  )
}
