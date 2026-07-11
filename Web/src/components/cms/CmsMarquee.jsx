const HEIGHT_MAP    = { xs: 28, sm: 36, md: 44, lg: 60, xl: 80 }
const FONT_SIZE_MAP = { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem' }
const FONT_WEIGHT_MAP = { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 }
const SPEED_MAP     = { slow: 60, medium: 30, fast: 15, 'very-fast': 8 }
const PADDING_MAP   = { none: '0', sm: '0.5rem', md: '1rem', lg: '1.5rem' }

export default function CmsMarquee({ config }) {
  const text          = config.text          ?? 'Marquee Text'
  const textColor     = config.text_color    ?? '#ffffff'
  const bgColor       = config.bg_color      ?? '#1e293b'
  const sectionBg     = config.section_bg_color ?? 'transparent'
  const height        = HEIGHT_MAP[config.height ?? 'md']
  const fontSize      = FONT_SIZE_MAP[config.font_size ?? 'sm']
  const fontWeight    = FONT_WEIGHT_MAP[config.font_weight ?? 'semibold']
  const duration      = SPEED_MAP[config.speed ?? 'medium']
  const direction     = config.direction     ?? 'left'
  const separator     = config.separator     ?? '\u2726'
  const sepColor      = config.separator_color ?? '#ffcc01'
  const useMulti      = config.use_multicolor ?? false
  const segments      = config.text_segments  ?? []
  const padding       = PADDING_MAP[config.padding ?? 'none']

  const animName = direction === 'right' ? 'cms-marquee-right' : 'cms-marquee-left'

  function TextContent() {
    if (useMulti && segments.length > 0) {
      return (
        <>
          {segments.map((seg, i) => (
            <span key={i} style={{ color: seg.color }}>{seg.text}</span>
          ))}
        </>
      )
    }
    return <span style={{ color: textColor }}>{text}</span>
  }

  function Separator() {
    return <span style={{ color: sepColor, margin: '0 1.5rem' }}>{separator}</span>
  }

  // We repeat the content 8 times across 2 identical halves (4 each) for seamless looping
  const REPS = 4

  return (
    <section style={{ background: sectionBg, padding: `${padding} 0` }}>
      <style>{`
        @keyframes cms-marquee-left  { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes cms-marquee-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
      `}</style>

      <div style={{
        height: `${height}px`,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          fontSize,
          fontWeight,
          animation: `${animName} ${duration}s linear infinite`,
          willChange: 'transform',
        }}>
          {/* Two identical halves so translateX(-50%) creates a seamless loop */}
          {[0, 1].map(half => (
            <span key={half} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {Array.from({ length: REPS }).map((_, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <TextContent />
                  <Separator />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
