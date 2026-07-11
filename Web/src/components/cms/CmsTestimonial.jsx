import { useState, useEffect, useRef } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, color = '#facc15' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 20 20" fill={s <= rating ? color : '#e2e8f0'} className="w-3.5 h-3.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ item, size = 'md' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-500`}>
      {item.avatar
        ? <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
        : item.name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Card style variants ──────────────────────────────────────────────────────

function TestimonialCard({ item, config }) {
  const { style, show_rating, show_avatar, show_company, card_bg, card_text } = config
  const cardStyle = { background: card_bg, color: card_text }

  if (style === 'quote') {
    return (
      <div className="relative flex flex-col gap-3 p-6 rounded-2xl" style={cardStyle}>
        <span className="absolute top-3 left-5 text-6xl leading-none opacity-10 font-serif select-none">"</span>
        {show_rating && item.rating > 0 && <StarRating rating={item.rating} />}
        <p className="text-sm leading-relaxed relative z-10">"{item.text}"</p>
        <div className="flex items-center gap-3 mt-1">
          {show_avatar && <Avatar item={item} size="sm" />}
          <div>
            <p className="text-sm font-bold">{item.name}</p>
            {item.role && <p className="text-xs opacity-60">{item.role}{show_company && item.company ? ` · ${item.company}` : ''}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (style === 'bubble') {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative p-4 rounded-2xl rounded-bl-sm shadow-sm" style={cardStyle}>
          {show_rating && item.rating > 0 && <div className="mb-2"><StarRating rating={item.rating} /></div>}
          <p className="text-sm leading-relaxed">"{item.text}"</p>
          <div className="absolute -bottom-2 left-5 w-4 h-4 rotate-45 rounded-sm" style={{ background: card_bg }} />
        </div>
        <div className="flex items-center gap-2 pl-2 pt-1">
          {show_avatar && <Avatar item={item} size="sm" />}
          <div>
            <p className="text-sm font-bold" style={{ color: card_text }}>{item.name}</p>
            {item.role && <p className="text-xs opacity-60" style={{ color: card_text }}>{item.role}{show_company && item.company ? ` · ${item.company}` : ''}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (style === 'minimal') {
    return (
      <div className="flex flex-col gap-3 py-4">
        {show_rating && item.rating > 0 && <StarRating rating={item.rating} />}
        <p className="text-sm leading-relaxed italic" style={{ color: card_text }}>"{item.text}"</p>
        <div className="flex items-center gap-2">
          {show_avatar && <Avatar item={item} size="sm" />}
          <div>
            <p className="text-sm font-semibold" style={{ color: card_text }}>{item.name}</p>
            {item.role && <p className="text-xs opacity-50" style={{ color: card_text }}>{item.role}{show_company && item.company ? ` · ${item.company}` : ''}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (style === 'bordered') {
    return (
      <div className="flex flex-col gap-3 p-5 rounded-2xl border-2" style={{ ...cardStyle, borderColor: card_text + '20' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {show_avatar && <Avatar item={item} />}
            <div>
              <p className="text-sm font-bold">{item.name}</p>
              {item.role && <p className="text-xs opacity-60">{item.role}{show_company && item.company ? ` · ${item.company}` : ''}</p>}
            </div>
          </div>
          {show_rating && item.rating > 0 && <StarRating rating={item.rating} />}
        </div>
        <p className="text-sm leading-relaxed">"{item.text}"</p>
      </div>
    )
  }

  // Default: card
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl shadow-sm" style={cardStyle}>
      {show_rating && item.rating > 0 && <StarRating rating={item.rating} />}
      <p className="text-sm leading-relaxed">"{item.text}"</p>
      <div className="flex items-center gap-3 mt-auto pt-2 border-t" style={{ borderColor: card_text + '15' }}>
        {show_avatar && <Avatar item={item} />}
        <div>
          <p className="text-sm font-semibold">{item.name}</p>
          {item.role && <p className="text-xs opacity-60">{item.role}{show_company && item.company ? ` · ${item.company}` : ''}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Grid columns map ─────────────────────────────────────────────────────────

const COLS = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

// ─── Layout: Grid ─────────────────────────────────────────────────────────────

function GridLayout({ config }) {
  const cols = COLS[config.columns] ?? COLS[3]
  return (
    <div className={`grid ${cols} gap-5`}>
      {config.items.map((item) => <TestimonialCard key={item.id} item={item} config={config} />)}
    </div>
  )
}

// ─── Layout: Masonry ──────────────────────────────────────────────────────────

function MasonryLayout({ config }) {
  const cols = config.columns ?? 3
  const colClass = cols === 2 ? 'columns-1 sm:columns-2' : cols === 4 ? 'columns-2 lg:columns-4' : 'columns-1 sm:columns-2 lg:columns-3'
  return (
    <div className={`${colClass} gap-5`}>
      {config.items.map((item) => (
        <div key={item.id} className="break-inside-avoid mb-5">
          <TestimonialCard item={item} config={config} />
        </div>
      ))}
    </div>
  )
}

// ─── Layout: Carousel ─────────────────────────────────────────────────────────

function CarouselLayout({ config }) {
  const [current, setCurrent] = useState(0)
  const paused = useRef(false)
  const total = config.items.length

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setCurrent((c) => (c + 1) % total)
    }, 4500)
    return () => clearInterval(t)
  }, [total])

  return (
    <div
      className="relative"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* Slides */}
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {config.items.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0 px-2">
              <div className="max-w-2xl mx-auto">
                <TestimonialCard item={item} config={config} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + total) % total)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % total)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {config.items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-current w-6 opacity-80' : 'w-2 opacity-30 bg-current'}`}
              style={{ color: config.card_text }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Layout: List ─────────────────────────────────────────────────────────────

function ListLayout({ config }) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      {config.items.map((item) => (
        <div key={item.id} className="flex items-start gap-5 p-5 rounded-2xl shadow-sm" style={{ background: config.card_bg, color: config.card_text }}>
          {config.show_avatar && <Avatar item={item} size="lg" />}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="font-bold">{item.name}</p>
                {item.role && <p className="text-sm opacity-60">{item.role}{config.show_company && item.company ? ` · ${item.company}` : ''}</p>}
              </div>
              {config.show_rating && item.rating > 0 && <StarRating rating={item.rating} />}
            </div>
            <p className="text-sm leading-relaxed">"{item.text}"</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Layout: Featured ─────────────────────────────────────────────────────────

function FeaturedLayout({ config }) {
  const [featured, ...rest] = config.items
  if (!featured) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Large featured card */}
      <div className="lg:col-span-3 flex flex-col gap-4 p-7 rounded-2xl shadow-sm" style={{ background: config.card_bg, color: config.card_text }}>
        {config.show_rating && featured.rating > 0 && <StarRating rating={featured.rating} />}
        <p className="text-lg leading-relaxed font-medium">"{featured.text}"</p>
        <div className="flex items-center gap-4 mt-auto pt-4 border-t" style={{ borderColor: config.card_text + '15' }}>
          {config.show_avatar && <Avatar item={featured} size="lg" />}
          <div>
            <p className="font-bold text-base">{featured.name}</p>
            {featured.role && <p className="text-sm opacity-60">{featured.role}{config.show_company && featured.company ? ` · ${featured.company}` : ''}</p>}
          </div>
        </div>
      </div>
      {/* Smaller side cards */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {rest.map((item) => <TestimonialCard key={item.id} item={item} config={config} />)}
      </div>
    </div>
  )
}

// ─── Layout: Wall (compact bubble mosaic) ─────────────────────────────────────

function WallLayout({ config }) {
  const cols = COLS[config.columns] ?? COLS[3]
  return (
    <div className={`grid ${cols} gap-3`}>
      {config.items.map((item) => (
        <div key={item.id} className="p-4 rounded-2xl shadow-sm" style={{ background: config.card_bg, color: config.card_text }}>
          {config.show_rating && item.rating > 0 && <div className="mb-2"><StarRating rating={item.rating} /></div>}
          <p className="text-xs leading-relaxed mb-3">"{item.text}"</p>
          <div className="flex items-center gap-2">
            {config.show_avatar && <Avatar item={item} size="sm" />}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{item.name}</p>
              {item.role && <p className="text-[10px] opacity-50 truncate">{item.role}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section background ───────────────────────────────────────────────────────

function getSectionStyle(config) {
  if (config.bg_type === 'image' && config.bg_image) {
    return { backgroundImage: `url(${config.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (config.bg_type === 'gradient') {
    return { background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }
  }
  return { background: config.bg_color }
}

const TEXT_COLOR = { light: 'text-white', dark: 'text-gray-900' }
const SUB_COLOR  = { light: 'text-white/70', dark: 'text-gray-500' }

// ─── Main export ──────────────────────────────────────────────────────────────

const LAYOUTS = {
  grid:     GridLayout,
  masonry:  MasonryLayout,
  carousel: CarouselLayout,
  list:     ListLayout,
  featured: FeaturedLayout,
  wall:     WallLayout,
}

export default function CmsTestimonial({ config }) {
  if (!config.items?.length) return null

  const sectionStyle = getSectionStyle(config)
  const headColor    = TEXT_COLOR[config.text_color] ?? TEXT_COLOR.dark
  const subColor     = SUB_COLOR[config.text_color]  ?? SUB_COLOR.dark

  const Layout = LAYOUTS[config.layout] ?? GridLayout

  return (
    <section style={sectionStyle} className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(config.heading || config.subheading) && (
          <div className="text-center mb-10">
            {config.heading && (
              <h2 className={`text-3xl font-extrabold ${headColor}`}>{config.heading}</h2>
            )}
            {config.subheading && (
              <p className={`mt-2 text-base ${subColor}`}>{config.subheading}</p>
            )}
          </div>
        )}
        <Layout config={config} />
      </div>
    </section>
  )
}
