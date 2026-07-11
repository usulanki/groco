import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import FacebookLogin from '@greatsumini/react-facebook-login'
import AppleLogin from 'react-apple-login'
import { getLoginPageLayout } from '../../lib/cmsCache'
import { authApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'

const RADIUS = { none: '0px', sm: '6px', md: '12px', lg: '16px', full: '9999px' }

const DEFAULT_CFG = {
  mode:                  'modal',
  page_layout:           'centered',
  page_bg_color:         '#f8fafc',
  split_bg_color:        '#ffcc01',
  show_logo:             true,
  title:                 'Welcome back',
  subtitle:              'Sign in to your account to continue',
  show_subtitle:         true,
  show_forgot_password:  true,
  show_register_link:    true,
  register_link_text:    "Don't have an account? Sign up",
  show_google:           true,
  show_facebook:         false,
  show_apple:            false,
  btn_label:             'Sign In',
  btn_bg:                '#ffcc01',
  btn_text_color:        '#1a1a1a',
  btn_radius:            'md',
  input_radius:          'md',
  card_shadow:           true,
  card_radius:           'lg',
  modal_overlay:         'rgba(0,0,0,0.5)',
  modal_close_on_outside: true,
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
    </svg>
  )
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

const FACEBOOK_APP_ID   = import.meta.env.VITE_FACEBOOK_APP_ID ?? ''
const APPLE_CLIENT_ID   = import.meta.env.VITE_APPLE_CLIENT_ID ?? ''

function LoginForm({ cfg, onClose, onSuccess }) {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoading(true)
      setError('')
      try {
        const data = await authApi.googleLogin({ access_token })
        login(data)
        onSuccess?.()
      } catch (err) {
        setError(err.message || 'Google sign-in failed')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Google sign-in failed'),
  })

  const btnR  = RADIUS[cfg.btn_radius   ?? 'md'] ?? '12px'
  const inpR  = RADIUS[cfg.input_radius ?? 'md'] ?? '12px'
  const cardR = RADIUS[cfg.card_radius  ?? 'lg'] ?? '16px'
  const cardShadow = cfg.card_shadow !== false ? '0 8px 32px rgba(0,0,0,0.12)' : 'none'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      login(data)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const hasSocial = cfg.show_google || cfg.show_facebook || cfg.show_apple

  return (
    <div
      className="w-full bg-white p-8"
      style={{ borderRadius: cardR, boxShadow: cardShadow, maxWidth: 400 }}
    >
      {cfg.show_logo && (
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-500">
            <span className="text-gray-900 font-black text-sm">G</span>
          </div>
          <span className="font-extrabold text-lg text-gray-900">Groco</span>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-1">{cfg.title || 'Welcome back'}</h1>
      {cfg.show_subtitle && (
        <p className="text-sm text-gray-500 mb-6">{cfg.subtitle}</p>
      )}

      {hasSocial && (
        <div className="flex flex-col gap-2.5 mb-5">
          {cfg.show_google && (
            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-2 w-full border border-gray-200 text-sm font-medium text-gray-700 py-2.5 hover:bg-gray-50 transition disabled:opacity-60" style={{ borderRadius: btnR }}>
              <GoogleIcon /> Continue with Google
            </button>
          )}
          {cfg.show_facebook && (
            FACEBOOK_APP_ID ? <FacebookLogin
              appId={FACEBOOK_APP_ID}
              onSuccess={async ({ accessToken }) => {
                setLoading(true)
                setError('')
                try {
                  const result = await authApi.facebookLogin({ access_token: accessToken })
                  login(result)
                  onSuccess?.()
                } catch (err) {
                  setError(err.message || 'Facebook sign-in failed')
                } finally {
                  setLoading(false)
                }
              }}
              onFail={() => setError('Facebook sign-in failed')}
              render={({ onClick }) => (
                <button type="button" onClick={onClick} disabled={loading} className="flex items-center justify-center gap-2 w-full border border-gray-200 text-sm font-medium text-gray-700 py-2.5 hover:bg-gray-50 transition disabled:opacity-60" style={{ borderRadius: btnR }}>
                  <FacebookIcon /> Continue with Facebook
                </button>
              )}
            /> : (
              <button type="button" disabled className="flex items-center justify-center gap-2 w-full border border-gray-200 text-sm font-medium text-gray-700 py-2.5 opacity-50 cursor-not-allowed" style={{ borderRadius: btnR }}>
                <FacebookIcon /> Continue with Facebook
              </button>
            )
          )}
          {cfg.show_apple && (
            APPLE_CLIENT_ID ? (
              <AppleLogin
                clientId={APPLE_CLIENT_ID}
                redirectURI={window.location.origin}
                usePopup={true}
                scope="name email"
                responseType="code id_token"
                responseMode="form_post"
                callback={async ({ authorization, user: appleUser }) => {
                  if (!authorization?.id_token) { setError('Apple sign-in failed'); return }
                  setLoading(true)
                  setError('')
                  try {
                    const result = await authApi.appleLogin({
                      id_token: authorization.id_token,
                      fname: appleUser?.name?.firstName,
                      lname: appleUser?.name?.lastName,
                    })
                    login(result)
                    onSuccess?.()
                  } catch (err) {
                    setError(err.message || 'Apple sign-in failed')
                  } finally {
                    setLoading(false)
                  }
                }}
                render={({ onClick }) => (
                  <button type="button" onClick={onClick} disabled={loading} className="flex items-center justify-center gap-2 w-full border border-gray-200 text-sm font-medium text-gray-700 py-2.5 hover:bg-gray-50 transition disabled:opacity-60" style={{ borderRadius: btnR }}>
                    <AppleIcon /> Continue with Apple
                  </button>
                )}
              />
            ) : (
              <button type="button" disabled className="flex items-center justify-center gap-2 w-full border border-gray-200 text-sm font-medium text-gray-700 py-2.5 opacity-50 cursor-not-allowed" style={{ borderRadius: btnR }}>
                <AppleIcon /> Continue with Apple
              </button>
            )
          )}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              style={{ borderRadius: inpR }}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {cfg.show_forgot_password && (
          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: cfg.btn_bg }}>
              Forgot password?
            </a>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-bold transition disabled:opacity-60"
          style={{ background: cfg.btn_bg, color: cfg.btn_text_color, borderRadius: btnR }}
        >
          {loading ? 'Signing in…' : (cfg.btn_label || 'Sign In')}
        </button>
      </form>

      {cfg.show_register_link && (
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/register" className="hover:underline" style={{ color: cfg.btn_bg }}>
            {cfg.register_link_text || "Don't have an account? Sign up"}
          </Link>
        </p>
      )}

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

export function LoginModal({ onClose, onSuccess }) {
  const [cfg, setCfg]       = useState(DEFAULT_CFG)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    getLoginPageLayout().then(c => { if (c) setCfg({ ...DEFAULT_CFG, ...c }) }).catch(() => {})
  }, [])

  // Trigger enter animation on next frame
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Lock body scroll
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
    opacity:   visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
    transition: 'opacity 240ms ease, transform 240ms cubic-bezier(0.34,1.2,0.64,1)',
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div className="relative w-full" style={{ maxWidth: 420, ...cardStyle }}>
        <LoginForm cfg={cfg} onClose={handleClose} onSuccess={() => { onSuccess?.(); handleClose() }} />
      </div>
    </div>
  )
}

// ─── Full page ────────────────────────────────────────────────────────────────

export default function CmsLoginPage() {
  const navigate  = useNavigate()
  const [cfg, setCfg] = useState(DEFAULT_CFG)

  useEffect(() => {
    getLoginPageLayout().then(c => { if (c) setCfg({ ...DEFAULT_CFG, ...c }) }).catch(() => {})
  }, [])

  const handleSuccess = useCallback(() => {
    navigate('/')
  }, [navigate])

  const isPage = cfg.mode === 'page'

  if (!isPage) {
    // If mode is modal, render as a page anyway (navigated directly to /login)
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: cfg.page_bg_color ?? '#f8fafc' }}>
        <div className="relative w-full" style={{ maxWidth: 420 }}>
          <LoginForm cfg={cfg} onClose={null} onSuccess={handleSuccess} />
        </div>
      </div>
    )
  }

  if (cfg.page_layout === 'centered') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: cfg.page_bg_color }}>
        <div className="relative w-full" style={{ maxWidth: 420 }}>
          <LoginForm cfg={cfg} onClose={null} onSuccess={handleSuccess} />
        </div>
      </div>
    )
  }

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
          <LoginForm cfg={cfg} onClose={null} onSuccess={handleSuccess} />
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
