import { useState } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSectionStyle(config) {
  if (config.bg_type === 'image' && config.bg_image) {
    return { backgroundImage: `url(${config.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (config.bg_type === 'gradient') {
    return { background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }
  }
  return { background: config.bg_color }
}

const BTN_RADIUS = { pill: 'rounded-full', rounded: 'rounded-lg', sharp: 'rounded-none' }
const INPUT_RADIUS = { pill: 'rounded-full', rounded: 'rounded-lg', sharp: 'rounded-none' }

// ─── Subscribe form (shared) ──────────────────────────────────────────────────

function SubscribeForm({ config, submitted, onSubmit, inputClass = '', wrapClass = '' }) {
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (email) onSubmit()
  }

  if (submitted) {
    return (
      <div className="bg-white/20 rounded-2xl px-6 py-4 text-center font-semibold text-sm" style={{ color: config.text_color === 'dark' ? '#1e293b' : '#ffffff' }}>
        {config.success_text}
      </div>
    )
  }

  const btnRadius  = BTN_RADIUS[config.button_style] ?? 'rounded-full'
  const inpRadius  = INPUT_RADIUS[config.button_style] ?? 'rounded-full'
  const btnStyle   = { background: config.button_bg, color: config.button_text_color }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${wrapClass}`}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={config.placeholder}
        required
        className={`flex-1 px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/60 ${inpRadius} ${inputClass}`}
      />
      <button type="submit" style={btnStyle}
        className={`font-bold px-7 py-3 whitespace-nowrap shadow-lg transition hover:opacity-90 ${btnRadius}`}>
        {config.button_text}
      </button>
    </form>
  )
}

// ─── Layout: Centered ─────────────────────────────────────────────────────────

function CenteredLayout({ config, submitted, onSubmit, headCls, subCls, discCls }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {config.show_emoji && <span className="text-4xl mb-4 block">{config.emoji}</span>}
      <h2 className={`text-2xl sm:text-3xl font-extrabold mb-3 ${headCls}`}>{config.heading}</h2>
      <p className={`text-sm sm:text-base mb-8 ${subCls}`}>{config.subheading}</p>
      <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit}
        inputClass="shadow" wrapClass="flex-col sm:flex-row justify-center" />
      {!submitted && config.show_disclaimer && (
        <p className={`text-xs mt-4 ${discCls}`}>{config.disclaimer_text}</p>
      )}
    </div>
  )
}

// ─── Layout: Split ────────────────────────────────────────────────────────────

function SplitLayout({ config, submitted, onSubmit, headCls, subCls, discCls }) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <div>
        {config.show_emoji && <span className="text-4xl mb-4 block">{config.emoji}</span>}
        <h2 className={`text-2xl sm:text-3xl font-extrabold mb-3 ${headCls}`}>{config.heading}</h2>
        <p className={`text-sm sm:text-base ${subCls}`}>{config.subheading}</p>
      </div>
      <div>
        <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit}
          inputClass="shadow" wrapClass="flex-col sm:flex-row" />
        {!submitted && config.show_disclaimer && (
          <p className={`text-xs mt-3 ${discCls}`}>{config.disclaimer_text}</p>
        )}
      </div>
    </div>
  )
}

// ─── Layout: Card ─────────────────────────────────────────────────────────────

function CardLayout({ config, submitted, onSubmit }) {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center">
      {config.show_emoji && <span className="text-4xl mb-4 block">{config.emoji}</span>}
      <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{config.heading}</h2>
      <p className="text-sm text-slate-500 mb-7">{config.subheading}</p>
      <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit}
        inputClass="bg-slate-100 shadow-inner" wrapClass="flex-col sm:flex-row" />
      {!submitted && config.show_disclaimer && (
        <p className="text-xs mt-4 text-slate-300">{config.disclaimer_text}</p>
      )}
    </div>
  )
}

// ─── Layout: Inline ───────────────────────────────────────────────────────────

function InlineLayout({ config, submitted, onSubmit, headCls, subCls, discCls }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-5">
        <div className="flex items-center gap-3 shrink-0">
          {config.show_emoji && <span className="text-3xl">{config.emoji}</span>}
          <div>
            <h2 className={`text-lg font-extrabold leading-tight ${headCls}`}>{config.heading}</h2>
            {config.subheading && <p className={`text-xs mt-0.5 ${subCls}`}>{config.subheading}</p>}
          </div>
        </div>
        <div className="flex-1 w-full">
          <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit}
            inputClass="shadow" wrapClass="" />
        </div>
      </div>
      {!submitted && config.show_disclaimer && (
        <p className={`text-xs mt-3 text-center lg:text-right ${discCls}`}>{config.disclaimer_text}</p>
      )}
    </div>
  )
}

// ─── Layout: Banner ───────────────────────────────────────────────────────────

function BannerLayout({ config, submitted, onSubmit, headCls, subCls, discCls }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-6">
      <div className="flex-1 flex items-center gap-4">
        {config.show_emoji && <span className="text-4xl shrink-0">{config.emoji}</span>}
        <div>
          <h2 className={`text-xl font-extrabold leading-snug ${headCls}`}>{config.heading}</h2>
          <p className={`text-sm mt-1 ${subCls}`}>{config.subheading}</p>
        </div>
      </div>
      <div className="flex-1 max-w-md w-full">
        <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit} inputClass="shadow" />
        {!submitted && config.show_disclaimer && (
          <p className={`text-xs mt-2 ${discCls}`}>{config.disclaimer_text}</p>
        )}
      </div>
    </div>
  )
}

// ─── Layout: Minimal ─────────────────────────────────────────────────────────

function MinimalLayout({ config, submitted, onSubmit, discCls }) {
  return (
    <div className="max-w-lg mx-auto">
      <SubscribeForm config={config} submitted={submitted} onSubmit={onSubmit} inputClass="shadow" />
      {!submitted && config.show_disclaimer && (
        <p className={`text-xs mt-3 text-center ${discCls}`}>{config.disclaimer_text}</p>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

const LAYOUTS = {
  centered: CenteredLayout,
  split:    SplitLayout,
  card:     CardLayout,
  inline:   InlineLayout,
  banner:   BannerLayout,
  minimal:  MinimalLayout,
}

export default function CmsNewsletter({ config }) {
  const [submitted, setSubmitted] = useState(false)

  const sectionStyle = getSectionStyle(config)
  const isDark  = config.text_color === 'dark'
  const headCls = isDark ? 'text-slate-900' : 'text-white'
  const subCls  = isDark ? 'text-slate-600' : 'text-white/80'
  const discCls = isDark ? 'text-slate-400' : 'text-white/60'

  const Layout = LAYOUTS[config.layout] ?? CenteredLayout

  const padding = config.layout === 'inline' || config.layout === 'banner' ? 'py-8' : 'py-14'

  return (
    <section style={sectionStyle} className={padding}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Layout
          config={config}
          submitted={submitted}
          onSubmit={() => setSubmitted(true)}
          headCls={headCls}
          subCls={subCls}
          discCls={discCls}
        />
      </div>
    </section>
  )
}
