import { useState, useEffect } from 'react'
import { getAnnouncementBarConfig } from '../../lib/cmsCache'

const FONT_SIZE_MAP   = { xs: '0.7rem', sm: '0.75rem', md: '0.8125rem' }
const FONT_WEIGHT_MAP = { normal: 400, medium: 500, semibold: 600, bold: 700 }
const PADDING_V_MAP   = { xs: '0.2rem', sm: '0.35rem', md: '0.5rem', lg: '0.75rem' }

// Shared pure renderer — used by both the above-nav container and the in-page CMS component.
// `dismissId` is the CMS component id — keyed this way so replacing the banner clears the dismissed state.
export function AnnouncementBarDisplay({ config, dismissId }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!config || !dismissId) return
    const key = `karto-ann-dismissed-${dismissId}`
    if (localStorage.getItem(key)) setDismissed(true)
  }, [config, dismissId])

  if (!config || !config.enabled || dismissed) return null

  const bgStyle =
    config.bg_type === 'gradient'
      ? { background: `linear-gradient(90deg, ${config.bg_from}, ${config.bg_to})` }
      : { background: config.bg_color }

  const fontSize   = FONT_SIZE_MAP[config.font_size    ?? 'sm']
  const fontWeight = FONT_WEIGHT_MAP[config.font_weight ?? 'medium']
  const paddingV   = PADDING_V_MAP[config.padding       ?? 'sm']
  const align      = config.align ?? 'center'
  const justify    = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
  const btnRadius  =
    config.button_style === 'pill'    ? '9999px' :
    config.button_style === 'rounded' ? '6px'    : '0'

  function dismiss(e) {
    e.preventDefault()
    e.stopPropagation()
    if (dismissId) localStorage.setItem(`karto-ann-dismissed-${dismissId}`, '1')
    setDismissed(true)
  }

  const inner = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap: '0.625rem',
      padding: `${paddingV} 2.5rem ${paddingV} 1rem`,
      color: config.text_color ?? '#ffffff',
      fontSize,
      fontWeight,
      position: 'relative',
      minHeight: 0,
    }}>
      <span>{config.text}</span>

      {config.show_button && config.button_text && (
        <a
          href={config.button_link || '#'}
          onClick={e => e.stopPropagation()}
          style={{
            borderRadius: btnRadius,
            padding: '0.1rem 0.6rem',
            fontSize: '0.68rem',
            fontWeight: 700,
            textDecoration: 'none',
            background: config.button_outlined ? 'transparent' : config.button_bg,
            color: config.button_text_color,
            border: `1.5px solid ${config.button_border_color || config.button_bg}`,
            whiteSpace: 'nowrap',
            lineHeight: 1.7,
            flexShrink: 0,
          }}
        >
          {config.button_text}
        </a>
      )}

      {config.dismissible && (
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            right: '0.625rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: config.text_color ?? '#ffffff',
            opacity: 0.75,
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '0 0.15rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  )

  if (config.bar_link) {
    return (
      <a href={config.bar_link} style={{ display: 'block', textDecoration: 'none', ...bgStyle }}>
        {inner}
      </a>
    )
  }

  return <div style={bgStyle}>{inner}</div>
}

// Default export — used by App.jsx to render above-nav bars only.
// Uses a dedicated fetch (not the shared layout cache) so it always
// reflects the latest saved config regardless of cache state.
export default function CmsAnnouncementBar() {
  const [bar, setBar] = useState(null) // { id, config }

  useEffect(() => {
    getAnnouncementBarConfig().then(result => {
      if (result) setBar(result)
    })
  }, [])

  return <AnnouncementBarDisplay config={bar?.config ?? null} dismissId={bar?.id ?? null} />
}
