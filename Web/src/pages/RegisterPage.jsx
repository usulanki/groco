import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { getLoginPageLayout } from '../lib/cmsCache'
import { useAuth } from '../lib/auth'

const RADIUS = { none: '0px', sm: '6px', md: '12px', lg: '16px', full: '9999px' }

const DEFAULT_CFG = {
  mode:           'modal',
  page_layout:    'centered',
  page_bg_color:  '#f8fafc',
  split_bg_color: '#ffcc01',
  show_logo:      true,
  btn_bg:         '#ffcc01',
  btn_text_color: '#1a1a1a',
  btn_radius:     'md',
  input_radius:   'md',
  card_shadow:    true,
  card_radius:    'lg',
  modal_overlay:  'rgba(0,0,0,0.5)',
  modal_close_on_outside: true,
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  )
}

function RegisterForm({ cfg, onClose, onSuccess }) {
  const { login } = useAuth()
  const [fname, setFname]       = useState('')
  const [lname, setLname]       = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const btnR       = RADIUS[cfg.btn_radius   ?? 'md'] ?? '12px'
  const inpR       = RADIUS[cfg.input_radius ?? 'md'] ?? '12px'
  const cardR      = RADIUS[cfg.card_radius  ?? 'lg'] ?? '16px'
  const cardShadow = cfg.card_shadow !== false ? '0 8px 32px rgba(0,0,0,0.12)' : 'none'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.register({ fname, lname, email, password, phone: phone || undefined })
      login(data)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="w-full bg-white p-8"
      style={{ borderRadius: cardR, boxShadow: cardShadow, maxWidth: 420 }}
    >
      {cfg.show_logo && (
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-500">
            <span className="text-gray-900 font-black text-sm">G</span>
          </div>
          <span className="font-extrabold text-lg text-gray-900">Groco</span>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-1">Create an account</h1>
      <p className="text-sm text-gray-500 mb-6">Sign up to start shopping</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
            <input
              type="text"
              value={fname}
              onChange={e => setFname(e.target.value)}
              required
              placeholder="John"
              className="w-full border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              style={{ borderRadius: inpR }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
            <input
              type="text"
              value={lname}
              onChange={e => setLname(e.target.value)}
              required
              placeholder="Doe"
              className="w-full border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              style={{ borderRadius: inpR }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            style={{ borderRadius: inpR }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            style={{ borderRadius: inpR }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full border border-gray-200 px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              style={{ borderRadius: inpR }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-bold transition disabled:opacity-60"
          style={{ background: cfg.btn_bg, color: cfg.btn_text_color, borderRadius: btnR }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="font-medium hover:underline" style={{ color: cfg.btn_bg }}>
          Sign in
        </Link>
      </p>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-10 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export function RegisterModal({ onClose, onSuccess }) {
  const [cfg, setCfg]         = useState(DEFAULT_CFG)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    getLoginPageLayout().then(c => { if (c) setCfg({ ...DEFAULT_CFG, ...c }) }).catch(() => {})
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose?.(), 220)
  }

  const handleOverlayClick = (e) => {
    if (cfg.modal_close_on_outside !== false && e.target === e.currentTarget) handleClose()
  }

  const overlayStyle = {
    background: cfg.modal_overlay ?? 'rgba(0,0,0,0.5)',
    opacity:    visible ? 1 : 0,
    transition: 'opacity 220ms ease',
  }

  const cardStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
    transition: 'opacity 240ms ease, transform 240ms cubic-bezier(0.34,1.2,0.64,1)',
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div className="relative w-full" style={{ maxWidth: 420, ...cardStyle }}>
        <RegisterForm cfg={cfg} onClose={handleClose} onSuccess={() => { onSuccess?.(); handleClose() }} />
      </div>
    </div>
  )
}

// ─── Full page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate      = useNavigate()
  const [cfg, setCfg] = useState(DEFAULT_CFG)

  useEffect(() => {
    getLoginPageLayout().then(c => { if (c) setCfg({ ...DEFAULT_CFG, ...c }) }).catch(() => {})
  }, [])

  const handleSuccess = useCallback(() => navigate('/'), [navigate])

  const isPage = cfg.mode === 'page'

  // ── Modal mode: render modal overlay on top of a blank background ──────────
  if (!isPage) {
    return (
      <ModalOnPage cfg={cfg} onSuccess={handleSuccess} />
    )
  }

  // ── Page mode: centered ───────────────────────────────────────────────────
  if (cfg.page_layout === 'centered') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: cfg.page_bg_color }}>
        <div className="relative w-full" style={{ maxWidth: 420 }}>
          <RegisterForm cfg={cfg} onClose={null} onSuccess={handleSuccess} />
        </div>
      </div>
    )
  }

  // ── Page mode: split layout ───────────────────────────────────────────────
  const isLeft = cfg.page_layout === 'split-left'
  return (
    <div className="min-h-screen flex">
      {isLeft && (
        <div className="hidden md:flex w-1/2 items-center justify-center" style={{ background: cfg.split_bg_color }}>
          <div className="text-gray-900 text-center px-12">
            <div className="text-4xl font-black mb-3">Groco</div>
            <div className="text-lg opacity-70">Your one-stop shop for everything.</div>
          </div>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ background: cfg.page_bg_color }}>
        <div className="relative w-full" style={{ maxWidth: 420 }}>
          <RegisterForm cfg={cfg} onClose={null} onSuccess={handleSuccess} />
        </div>
      </div>
      {!isLeft && (
        <div className="hidden md:flex w-1/2 items-center justify-center" style={{ background: cfg.split_bg_color }}>
          <div className="text-gray-900 text-center px-12">
            <div className="text-4xl font-black mb-3">Groco</div>
            <div className="text-lg opacity-70">Your one-stop shop for everything.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal rendered on top of a transparent page (for direct /register navigation) ──

function ModalOnPage({ cfg, onSuccess }) {
  const navigate      = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => navigate(-1), 220)
  }

  const handleOverlayClick = (e) => {
    if (cfg.modal_close_on_outside !== false && e.target === e.currentTarget) handleClose()
  }

  const overlayStyle = {
    background: cfg.modal_overlay ?? 'rgba(0,0,0,0.5)',
    opacity:    visible ? 1 : 0,
    transition: 'opacity 220ms ease',
  }

  const cardStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
    transition: 'opacity 240ms ease, transform 240ms cubic-bezier(0.34,1.2,0.64,1)',
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div className="relative w-full" style={{ maxWidth: 420, ...cardStyle }}>
        <RegisterForm
          cfg={cfg}
          onClose={handleClose}
          onSuccess={() => { onSuccess?.() }}
        />
      </div>
    </div>
  )
}
