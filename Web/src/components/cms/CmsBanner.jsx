import { useState, useEffect, useRef } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HEIGHTS = {
  sm: 'min-h-[200px]',
  md: 'min-h-[360px]',
  lg: 'min-h-[480px]',
  xl: 'min-h-[600px]',
}

const RATIOS = {
  'ratio-16-9': 'aspect-[16/9]',
  'ratio-2-1':  'aspect-[2/1]',
  'ratio-21-9': 'aspect-[21/9]',
  'ratio-3-1':  'aspect-[3/1]',
  'ratio-4-1':  'aspect-[4/1]',
}

function getBannerSizeCls(height) {
  return RATIOS[height] ?? HEIGHTS[height] ?? HEIGHTS.md
}

const ROUNDED = {
  none:  '',
  md:    'rounded-md',
  lg:    'rounded-lg',
  xl:    'rounded-xl',
  '2xl': 'rounded-2xl',
}

const CONTAINER_PAD = {
  full: '',
  sm:   'px-4 sm:px-6',
  md:   'px-8 sm:px-12',
  lg:   'px-12 sm:px-20',
}

const MARGIN_TOP = {
  none: '',
  sm:   'mt-2',
  md:   'mt-4',
  lg:   'mt-8',
  xl:   'mt-12',
}

const MARGIN_BOTTOM = {
  none: '',
  sm:   'mb-2',
  md:   'mb-4',
  lg:   'mb-8',
  xl:   'mb-12',
}

const TEXT_PADDING = {
  none: 0,
  sm:   40,
  md:   80,
  lg:   140,
  xl:   220,
}

const FONT_WEIGHT_MAP = {
  normal:    400,
  semibold:  600,
  bold:      700,
  extrabold: 800,
  black:     900,
}

function resolveTextColor(c) {
  if (c === 'light') return '#ffffff'
  if (c === 'dark')  return '#1e293b'
  return c || '#ffffff'
}

function resolveBannerLayout(layout) {
  if (layout === 'text-left')         return 'overlay-left'
  if (layout === 'text-right')        return 'overlay-right'
  if (layout === 'text-slight-left')  return 'overlay-slight-left'
  if (layout === 'text-slight-right') return 'overlay-slight-right'
  if (layout === 'text-center')       return 'overlay-center'
  return layout || 'overlay-left'
}

function getSlideStyle(slide) {
  if (slide.bg_type === 'image' && slide.bg_image)
    return { backgroundImage: `url(${slide.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  if (slide.bg_type === 'solid')
    return { background: slide.bg_color }
  return { background: `linear-gradient(135deg, ${slide.bg_from}, ${slide.bg_to})` }
}

// ─── App Download Buttons ─────────────────────────────────────────────────────

function PlayStoreIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none">
      <path d="M3.18 23.76A2 2 0 0 1 2 22V2a2 2 0 0 1 1.18-1.76l11.53 11.53L3.18 23.76Z" fill="#EA4335"/>
      <path d="M20.5 12 17 10.13 14.71 12 17 13.87 20.5 12Z" fill="#FBBC05"/>
      <path d="m17 10.13-13.82-7.9A2 2 0 0 1 4.5 2l12.5 8.13Z" fill="#4285F4"/>
      <path d="m17 13.87-12.5 8.13a2 2 0 0 1-1.32-.13L17 13.87Z" fill="#34A853"/>
    </svg>
  )
}

function AppleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"/>
    </svg>
  )
}

const APP_BTN_SIZE = {
  sm: { btn: 'px-3 py-1.5 gap-1.5 rounded-lg',   icon: 'w-4 h-4',   text: '11px' },
  md: { btn: 'px-4 py-2.5 gap-2 rounded-xl',     icon: 'w-5 h-5',   text: '13px' },
  lg: { btn: 'px-6 py-3.5 gap-2.5 rounded-xl',   icon: 'w-6 h-6',   text: '15px' },
}

function AppDownloadButtons({ slide, color }) {
  if (!slide.show_app_download) return null
  const hasAndroid = slide.android_link || slide.android_label
  const hasIos     = slide.ios_link     || slide.ios_label
  if (!hasAndroid && !hasIos) return null

  const btnStyle = slide.app_btn_style ?? 'dark'
  const size     = APP_BTN_SIZE[slide.app_btn_size ?? 'md'] ?? APP_BTN_SIZE.md

  const darkBtnStyle  = { background: '#000000', color: '#ffffff' }
  const lightBtnStyle = { background: 'rgba(255,255,255,0.92)', color: '#1a1a1a', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
  const btnSt = btnStyle === 'dark' ? darkBtnStyle : lightBtnStyle

  const iconCls = size.icon

  return (
    <div className="flex flex-col gap-2.5 mt-6">
      {slide.app_download_label && (
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color, opacity: 0.65 }}>
          {slide.app_download_label}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {hasAndroid && (
          <a href={slide.android_link || '#'} target="_blank" rel="noreferrer"
            className={`flex items-center font-semibold transition hover:opacity-85 active:scale-95 ${size.btn}`}
            style={{ ...btnSt, fontSize: size.text }}>
            <PlayStoreIcon className={iconCls} />
            <span>{slide.android_label || 'Google Play'}</span>
          </a>
        )}
        {hasIos && (
          <a href={slide.ios_link || '#'} target="_blank" rel="noreferrer"
            className={`flex items-center font-semibold transition hover:opacity-85 active:scale-95 ${size.btn}`}
            style={{ ...btnSt, fontSize: size.text }}>
            <AppleIcon className={iconCls} />
            <span>{slide.ios_label || 'App Store'}</span>
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Shared text block builder ────────────────────────────────────────────────

function SlideTextBlock({ slide, alignCls, widthCls = 'max-w-xl', style = {} }) {
  const color    = resolveTextColor(slide.text_color)
  const subColor = slide.subtitle_color ? resolveTextColor(slide.subtitle_color) : color
  const showCta  = (slide.show_cta ?? true) && !!slide.cta_text

  const ctaRadius =
    slide.cta_style === 'pill'    ? 'rounded-full' :
    slide.cta_style === 'rounded' ? 'rounded-xl'   : 'rounded-none'

  return (
    <div className={`${widthCls} py-8 flex flex-col gap-3 ${alignCls}`} style={style}>
      {slide.eyebrow && (
        <p className="text-sm font-medium tracking-wide" style={{ color, opacity: 0.75 }}>
          {slide.eyebrow}
        </p>
      )}
      <h1
        className="leading-tight drop-shadow"
        style={{
          color,
          fontSize:   slide.title_size   ? `${slide.title_size}px`   : undefined,
          fontWeight: FONT_WEIGHT_MAP[slide.title_weight ?? 'extrabold'] ?? 800,
        }}
      >
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p
          className="max-w-lg leading-relaxed"
          style={{
            color:      subColor,
            opacity:    0.85,
            fontSize:   slide.subtitle_size   ? `${slide.subtitle_size}px`   : undefined,
            fontWeight: FONT_WEIGHT_MAP[slide.subtitle_weight ?? 'normal'] ?? 400,
          }}
        >
          {slide.subtitle}
        </p>
      )}
      {showCta && (
        <div>
          <a
            href={slide.cta_link || '#'}
            className={`inline-block font-bold px-8 py-3.5 transition shadow-lg text-sm ${ctaRadius}`}
            style={{ background: slide.cta_color ?? '#ffffff', color: slide.cta_text_color ?? '#1e293b' }}
          >
            {slide.cta_text}
          </a>
        </div>
      )}
      {slide.fine_print && (
        <p className="text-xs underline underline-offset-2 mt-1" style={{ color, opacity: 0.55 }}>
          {slide.fine_print}
        </p>
      )}
      <AppDownloadButtons slide={slide} color={resolveTextColor(slide.text_color)} />
    </div>
  )
}

// ─── Split Slide (image as background, text overlaid on one half) ─────────────

function SplitSlide({ slide, layout, height, paddingLeft = 32, paddingRight = 32 }) {
  // split-image-left  → image subject on left  → text on right half
  // split-image-right → image subject on right → text on left half
  const textOnRight  = layout === 'split-image-left'
  const align        = slide.text_align ?? 'left'
  const alignCls     =
    align === 'center' ? 'items-center text-center' :
    align === 'right'  ? 'items-end text-right'     : 'items-start text-left'
  const outerJustify = textOnRight ? 'justify-end' : 'justify-start'
  const hasImage     = slide.bg_type === 'image' && slide.bg_image

  const textRow = (
    <div className={`w-full flex ${outerJustify}`} style={{ paddingLeft, paddingRight }}>
      <SlideTextBlock slide={slide} alignCls={alignCls} />
    </div>
  )

  if (hasImage) {
    return (
      <div className="w-full relative">
        <img src={slide.bg_image} alt="" className="w-full block" />
        <div className="absolute inset-0 flex items-center">{textRow}</div>
      </div>
    )
  }

  return (
    <div
      className={`w-full relative flex items-center ${getBannerSizeCls(height)}`}
      style={getSlideStyle(slide)}
    >
      {textRow}
    </div>
  )
}

// ─── Hero Slide ───────────────────────────────────────────────────────────────

function HeroSlide({ slide, height, paddingLeft = 32, paddingRight = 32 }) {
  const layout = resolveBannerLayout(slide.layout)

  if (layout === 'split-image-left' || layout === 'split-image-right') {
    return <SplitSlide slide={slide} layout={layout} height={height} paddingLeft={paddingLeft} paddingRight={paddingRight} />
  }

  const align      = slide.text_align ?? 'left'
  const isCenter   = layout === 'overlay-center'
  const isRight    = layout === 'overlay-right'
  const isSlLeft   = layout === 'overlay-slight-left'
  const isSlRight  = layout === 'overlay-slight-right'
  const hasImage   = slide.bg_type === 'image' && slide.bg_image

  const alignCls     =
    align === 'center' ? 'items-center text-center' :
    align === 'right'  ? 'items-end text-right'     : 'items-start text-left'
  const outerJustify = isCenter ? 'justify-center' : isRight ? 'justify-end' : 'justify-start'
  const innerStyle   = isSlLeft  ? { marginLeft: '15%' } :
                       isSlRight ? { marginLeft: '40%' } : {}
  const widthCls     = isCenter ? 'max-w-2xl w-full' : 'max-w-xl'

  const textRow = (
    <div className={`w-full flex ${outerJustify}`} style={{ paddingLeft, paddingRight }}>
      <SlideTextBlock slide={slide} alignCls={alignCls} widthCls={widthCls} style={innerStyle} />
    </div>
  )

  if (hasImage) {
    return (
      <div className="w-full relative">
        <img src={slide.bg_image} alt="" className="w-full block" />
        <div className="absolute inset-0 flex items-center">{textRow}</div>
      </div>
    )
  }

  return (
    <div
      className={`w-full relative flex items-center ${getBannerSizeCls(height)}`}
      style={getSlideStyle(slide)}
    >
      {textRow}
    </div>
  )
}

// ─── Arrow Button ─────────────────────────────────────────────────────────────

function ArrowButton({ direction, arrowStyle, onClick, position = 'side' }) {
  const shapeCls =
    arrowStyle === 'circle'          ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm text-xl' :
    arrowStyle === 'square'          ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-sm bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm text-xl' :
    arrowStyle === 'square-sharp'    ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-none bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm text-xl' :
    arrowStyle === 'rectangle'       ? 'w-8 h-14 rounded-sm bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm text-xl' :
    arrowStyle === 'rectangle-sharp' ? 'w-8 h-14 rounded-none bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm text-xl' :
    /* minimal */                      'w-10 h-10 text-white drop-shadow-lg text-3xl font-light'

  const sideCls = position === 'side'
    ? `absolute top-1/2 -translate-y-1/2 z-10 ${direction === 'prev' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'}`
    : ''

  return (
    <button
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      className={`flex items-center justify-center transition ${shapeCls} ${sideCls}`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CmsBanner({ config }) {
  const slides = config.slides ?? []
  const [current, setCurrent]         = useState(0)
  const [hovering, setHovering]       = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const paused = useRef(false)
  const total  = slides.length

  useEffect(() => {
    if (!config.auto_play || total <= 1) return
    const ms = (config.auto_play_interval ?? 5) * 1000
    const t  = setInterval(() => {
      if (!paused.current) setCurrent(c => (c + 1) % total)
    }, ms)
    return () => clearInterval(t)
  }, [config.auto_play, config.auto_play_interval, total])

  if (total === 0) return null

  const arrowStyle    = config.arrow_style    ?? 'circle'
  const arrowPosition = config.arrow_position ?? 'sides'
  const arrowOnHover  = config.arrow_on_hover ?? false
  const hasArrows     = arrowStyle !== 'none' && total > 1
  const showArrows    = hasArrows && (!arrowOnHover || hovering)
  const showDots      = (config.show_dots ?? true) && total > 1
  const isBottomRight = arrowPosition === 'bottom-right'
  const roundedCls    = ROUNDED[config.rounded    ?? 'none']
  const containerPad  = CONTAINER_PAD[config.container ?? 'full']
  const marginTop     = MARGIN_TOP[config.margin_top    ?? 'none']
  const marginBottom  = MARGIN_BOTTOM[config.margin_bottom ?? 'none']
  const textPadLeft   = TEXT_PADDING[config.text_padding_left  ?? 'md']
  const textPadRight  = TEXT_PADDING[config.text_padding_right ?? 'md']

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)
  const togglePause = () => {
    const next = !manualPaused
    setManualPaused(next)
    paused.current = next
  }

  return (
    <div className={`${containerPad} ${marginTop} ${marginBottom}`.trim()}>
      <section
        className={`relative overflow-hidden ${roundedCls}`}
        onMouseEnter={() => { if (!manualPaused && config.pause_on_hover) paused.current = true;  setHovering(true)  }}
        onMouseLeave={() => { if (!manualPaused && config.pause_on_hover) paused.current = false; setHovering(false) }}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map(s => (
            <div key={s.id} className="w-full flex-shrink-0">
              <HeroSlide slide={s} height={config.height ?? 'md'} paddingLeft={textPadLeft} paddingRight={textPadRight} />
            </div>
          ))}
        </div>

        {/* Side arrows */}
        {showArrows && !isBottomRight && (
          <>
            <ArrowButton direction="prev" arrowStyle={arrowStyle} onClick={prev} />
            <ArrowButton direction="next" arrowStyle={arrowStyle} onClick={next} />
          </>
        )}

        {/* Bottom-right grouped controls */}
        {isBottomRight && (
          <div className={`absolute bottom-4 right-4 flex items-center gap-1.5 z-10 transition-opacity duration-200 ${arrowOnHover && !hovering ? 'opacity-0' : 'opacity-100'}`}>
            {showDots && (
              <div className="flex items-center gap-1.5 mr-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'w-5 bg-white shadow' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
            {hasArrows && (
              <>
                <ArrowButton direction="prev" arrowStyle={arrowStyle} onClick={prev} position="inline" />
                <ArrowButton direction="next" arrowStyle={arrowStyle} onClick={next} position="inline" />
              </>
            )}
            {config.auto_play && total > 1 && (
              <button
                onClick={togglePause}
                aria-label={manualPaused ? 'Play' : 'Pause'}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/80 hover:bg-white shadow-lg text-slate-700 backdrop-blur-sm transition text-xs font-bold"
              >
                {manualPaused ? '▶' : '⏸'}
              </button>
            )}
          </div>
        )}

        {/* Standard dots (sides mode only) */}
        {showDots && !isBottomRight && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-7 bg-white shadow' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
