import { useState, useEffect, useRef } from 'react'

const GAP = { none: 'gap-0', sm: 'gap-2', md: 'gap-4', lg: 'gap-6' }
const RADIUS = { none: 'rounded-none', sm: 'rounded-lg', md: 'rounded-2xl', lg: 'rounded-3xl', xl: 'rounded-[2rem]' }
const ASPECT = {
  '5:1': 'aspect-[5/1]', '4:1': 'aspect-[4/1]', '3:1': 'aspect-[3/1]',
  '2:1': 'aspect-[2/1]', '16:9': 'aspect-video', '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square', '4:5': 'aspect-[4/5]', '3:4': 'aspect-[3/4]', '9:16': 'aspect-[9/16]',
}

function Slide({ slide, radius }) {
  const bgStyle =
    slide.bg_type === 'image' && slide.bg_image
      ? { backgroundImage: `url(${slide.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : slide.bg_type === 'solid'
        ? { background: slide.bg_color }
        : { background: `linear-gradient(135deg, ${slide.bg_from}, ${slide.bg_to})` }

  const isCenter = slide.layout === 'text-center'
  const isRight  = slide.layout === 'text-right'
  const isFull   = slide.layout === 'full-image'
  const textDark = slide.text_color === 'dark'

  const ctaClass = {
    pill:    'rounded-full',
    rounded: 'rounded-xl',
    sharp:   'rounded-none',
  }[slide.cta_style ?? 'pill']

  return (
    <div
      className={['relative overflow-hidden flex-shrink-0 w-full', RADIUS[radius] ?? RADIUS.md].join(' ')}
      style={bgStyle}
    >
      {!isFull && (
        <div
          className={[
            'flex items-center gap-4 px-6 py-5 h-full',
            isCenter ? 'flex-col text-center justify-center' : isRight ? 'flex-row-reverse' : 'flex-row',
          ].join(' ')}
        >
          <div className={['flex-1', isCenter ? 'flex flex-col items-center' : ''].join(' ')}>
            {slide.badge && (
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2"
                style={{ background: slide.badge_bg || 'rgba(255,255,255,0.25)', color: textDark ? '#1e293b' : '#fff' }}
              >
                {slide.badge}
              </span>
            )}
            <p className={['font-extrabold text-lg leading-snug drop-shadow', textDark ? 'text-slate-900' : 'text-white'].join(' ')}>
              {slide.title}
            </p>
            {slide.subtitle && (
              <p className={['text-sm mt-1', textDark ? 'text-slate-600' : 'text-white/80'].join(' ')}>
                {slide.subtitle}
              </p>
            )}
            {slide.cta_text && (
              <a
                href={slide.cta_link || '#'}
                className={['inline-block mt-3 bg-white text-slate-800 text-xs font-bold px-4 py-1.5 shadow', ctaClass].join(' ')}
              >
                {slide.cta_text}
              </a>
            )}
          </div>
          {slide.emoji && (
            <div className="text-4xl flex-shrink-0">{slide.emoji}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CmsBannerStrip({ config }) {
  const [current, setCurrent] = useState(0)
  const timerRef  = useRef(null)
  const paused    = useRef(false)
  const slides    = config.slides ?? []
  const spv       = config.slides_per_view ?? 1
  const isMulti   = spv > 1

  const gapClass    = GAP[config.gap ?? 'md']
  const radiusKey   = config.radius ?? 'md'
  const aspectClass = ASPECT[config.aspect_ratio ?? '3:1'] ?? ASPECT['3:1']

  // Auto-advance for single-slide view
  useEffect(() => {
    if (isMulti || slides.length <= 1) return
    function advance() {
      if (!paused.current) setCurrent(c => (c + 1) % slides.length)
    }
    timerRef.current = setInterval(advance, 4000)
    return () => clearInterval(timerRef.current)
  }, [isMulti, slides.length])

  if (slides.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {isMulti ? (
        // Multi-slide: show as a scrollable row
        <div className={['flex overflow-x-auto no-scrollbar', gapClass].join(' ')}>
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={['flex-shrink-0', aspectClass].join(' ')}
              style={{ width: `${100 / spv}%` }}
            >
              <Slide slide={slide} radius={radiusKey} />
            </div>
          ))}
        </div>
      ) : (
        // Single-slide: transition between slides
        <div
          className="relative"
          onMouseEnter={() => { paused.current = true }}
          onMouseLeave={() => { paused.current = false }}
        >
          <div className={aspectClass}>
            <Slide slide={slides[current]} radius={radiusKey} />
          </div>

          {config.show_arrows && slides.length > 1 && (
            <>
              <button
                onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrent(c => (c + 1) % slides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          {config.show_dots && slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={[
                    'h-2 rounded-full transition-all duration-300',
                    i === current ? 'bg-white w-5' : 'bg-white/50 w-2',
                  ].join(' ')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
