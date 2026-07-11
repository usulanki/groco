import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { categoriesApi, productsApi } from '../../lib/api'

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE
import { getLoginPageLayout } from '../../lib/cmsCache'
import { LoginModal } from './CmsLoginPage'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { useCartDrawer } from '../../lib/cartDrawer'

function Logo({ config }) {
  if (config.logo_type === 'image' && config.logo_image) {
    return (
      <a href="/" className="flex-shrink-0">
        <img src={config.logo_image} alt={config.logo_text || 'Logo'} className="h-8 object-contain" />
      </a>
    )
  }
  return (
    <a href="/" className="flex-shrink-0 flex items-center gap-1.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: config.logo_icon_bg ?? '#ffcc01' }}>
        <span className="font-black text-sm" style={{ color: config.logo_icon_text_color ?? '#1a1a1a' }}>
          {config.logo_icon_text || 'G'}
        </span>
      </div>
      <span className="text-xl font-extrabold" style={{ color: config.logo_text_color ?? '#0f172a' }}>
        {config.logo_text || 'Groco'}
      </span>
    </a>
  )
}

function SearchBar({ className = '' }) {
  const [q, setQ]                   = useState('')
  const [focused, setFocused]       = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]   = useState(false)
  const navigate    = useNavigate()
  const containerRef = useRef(null)

  // Debounced suggestions
  useEffect(() => {
    if (!focused || !q.trim()) { setSuggestions([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(() => {
      productsApi.list({ search: q.trim(), limit: 6, sort: 'relevance' })
        .then(data => setSuggestions(data?.rows ?? []))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q, focused])

  // Escape key + outside click
  useEffect(() => {
    if (!focused) return
    function onKey(e) { if (e.key === 'Escape') setFocused(false) }
    function onOut(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setFocused(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOut)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOut) }
  }, [focused])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) { navigate(`/search?q=${encodeURIComponent(trimmed)}`); setFocused(false) }
  }

  function handleSelect(p) {
    navigate(`/product/${p.slug ?? p.id}`)
    setFocused(false)
    setQ('')
  }

  const showDropdown = focused && q.trim().length > 0

  return (
    <>
      {/* Full-page overlay — desktop only, sits behind the sticky navbar */}
      {focused && createPortal(
        <div className="hidden sm:block fixed inset-0 bg-black/40 z-[48]" onMouseDown={() => setFocused(false)} />,
        document.body,
      )}

      <div ref={containerRef} className={`relative ${className}`} style={{ zIndex: focused ? 49 : undefined }}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search products, brands and categories..."
            className="w-full border border-gray-200 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-white"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-500 hover:bg-brand-600 text-white rounded-full p-2 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
        </form>

        {/* Suggestion dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No results for "{q}"</p>
            ) : (
              <>
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map(p => {
                    const price   = p.prices?.[0]
                    const sell    = price ? Number(price.final_price ?? price.price) : 0
                    const orig    = price?.compare_at_price ? Number(price.compare_at_price) : sell
                    const primary = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
                    const img     = primary?.path ? `${MEDIA_BASE}${primary.path}` : null
                    return (
                      <li key={p.id} className="border-b border-gray-50 last:border-0">
                        <button
                          type="button"
                          onMouseDown={() => handleSelect(p)}
                          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-yellow-50 transition text-left"
                        >
                          <div className="w-11 h-11 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                            {img
                              ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-slate-200" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                            {p.Category?.name && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{p.Category.name}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-semibold text-slate-800">₹{sell.toLocaleString('en-IN')}</p>
                            {orig > sell && (
                              <p className="text-[11px] text-slate-400 line-through">₹{orig.toLocaleString('en-IN')}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <button
                  type="button"
                  onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(q.trim())}`); setFocused(false) }}
                  className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-semibold text-yellow-700 hover:bg-yellow-50 border-t border-gray-100 transition"
                >
                  See all results for "{q}"
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function MobileSearchBar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const onSearch  = location.pathname === '/search'
  const initQ     = onSearch ? (new URLSearchParams(location.search).get('q') ?? '') : ''
  const [q, setQ] = useState(initQ)

  // Sync input when URL changes externally (e.g. browser back)
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlQ = new URLSearchParams(location.search).get('q') ?? ''
      setQ(urlQ)
    } else {
      setQ('')
    }
  }, [location])

  // Navigate to search page as user types
  useEffect(() => {
    const trimmed = q.trim()
    const t = setTimeout(() => {
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: onSearch })
      } else if (onSearch) {
        navigate('/search', { replace: true })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  function handleFocus() {
    if (!onSearch) navigate('/search', { replace: false })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: onSearch })
  }

  return (
    <div className="sm:hidden pb-3">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search products, brands and categories..."
          className="w-full border border-gray-200 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
        <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-500 hover:bg-brand-600 text-white rounded-full p-2 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      </form>
    </div>
  )
}


function NavIcons({ config, onAccount, user, isAuthenticated, onLogout }) {
  const color = config.link_color ?? '#4b5563'
  const navigate = useNavigate()
  const { cartCount } = useCart()
  const { openDrawer } = useCartDrawer()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  function handleAccountClick() {
    if (isAuthenticated) setDropdownOpen(o => !o)
    else onAccount()
  }

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {config.show_account && (
        <div ref={dropdownRef} className="relative hidden sm:block">
          <button
            onClick={handleAccountClick}
            className="flex items-center gap-1.5 text-sm font-medium transition"
            style={{ color }}
          >
            {isAuthenticated ? (
              <>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: config.link_hover_color ?? '#ffcc01' }}>
                  {user.fname?.charAt(0)}{user.lname?.charAt(0)}
                </div>
                <span>{user.fname}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </>
            )}
          </button>
          {dropdownOpen && isAuthenticated && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.fname} {user.lname}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <a href="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                My Account
              </a>
              <a href="/account?tab=orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                Orders
              </a>
              <a href="/account?tab=wishlist" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                Wishlist
              </a>
              <a href="/account?tab=coupons" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                Coupons
              </a>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { onLogout(); setDropdownOpen(false) }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {config.show_cart && (
        <button onClick={openDrawer} className="relative p-2 transition" style={{ color }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

function SearchIconButton({ color }) {
  return (
    <button className="p-2 transition" style={{ color }}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    </button>
  )
}

function LinksRow({ links, config }) {
  if (!links.length) return null
  return (
    <nav className="hidden sm:flex items-center gap-6 border-t py-2 overflow-x-auto no-scrollbar"
      style={{ borderColor: config.border_color ?? '#e2e8f0' }}>
      {links.map(link => (
        <a
          key={link.key}
          href={link.href}
          className="text-sm font-medium whitespace-nowrap transition"
          style={{ color: config.link_color ?? '#4b5563' }}
          onMouseEnter={e => { e.currentTarget.style.color = config.link_hover_color ?? '#ffcc01' }}
          onMouseLeave={e => { e.currentTarget.style.color = config.link_color ?? '#4b5563' }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}

export default function CmsNavbar({ config }) {
  const { user, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen]           = useState(false)
  const [navCategories, setNavCategories] = useState([])
  const [loginMode, setLoginMode]         = useState('modal')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const navigate = useNavigate()
  const layout = config.layout ?? 'standard'

  // Mobile scroll-hide: hide logo row on scroll-up, reveal on scroll-down
  const [navHidden, setNavHidden] = useState(false)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    function onScroll() {
      if (window.innerWidth >= 640) { setNavHidden(false); return }
      const curr = window.scrollY
      const prev = lastScrollYRef.current
      if (curr < 10) {
        setNavHidden(false)
      } else if (curr > prev + 4) {
        setNavHidden(true)          // scrolling down → hide logo row
      } else if (curr < prev) {
        setNavHidden(false)         // scrolling up → reveal
      }
      lastScrollYRef.current = curr
    }
    function onResize() {
      if (window.innerWidth >= 640) setNavHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    if (config.show_categories) {
      categoriesApi.getAll().then(setNavCategories).catch(() => {})
    }
  }, [config.show_categories])

  useEffect(() => {
    getLoginPageLayout().then(c => { if (c?.mode) setLoginMode(c.mode) }).catch(() => {})
  }, [])

  const handleAccount = () => {
    if (loginMode === 'modal') setShowLoginModal(true)
    else navigate('/login')
  }

  const allLinks = [
    ...(config.show_categories ? navCategories.map(cat => ({ key: cat.id, label: cat.name, href: `/category/${cat.slug}` })) : []),
    ...(config.custom_links ?? []).map(l => ({ key: l.id, label: l.label, href: l.url })),
  ]

  const mobileDrawer = menuOpen && (
    <div className="sm:hidden border-t px-4 py-4 space-y-1"
      style={{ borderColor: config.border_color ?? '#e2e8f0', background: config.bg_color ?? '#ffffff' }}>
      {allLinks.map(link => (
        <a key={link.key} href={link.href}
          className="block py-2 px-3 rounded-lg text-sm font-medium transition"
          style={{ color: config.link_color ?? '#4b5563' }}
          onClick={() => setMenuOpen(false)}>
          {link.label}
        </a>
      ))}
      {config.show_account && (
        <div className="border-t mt-2 pt-2" style={{ borderColor: config.border_color ?? '#e2e8f0' }}>
          {isAuthenticated ? (
            <>
              <a href="/account"
                className="block py-2 px-3 rounded-lg text-sm font-medium"
                style={{ color: config.link_color ?? '#4b5563' }}
                onClick={() => setMenuOpen(false)}>
                My Account
              </a>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-red-500">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => { setMenuOpen(false); handleAccount() }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium"
              style={{ color: config.link_color ?? '#4b5563' }}>
              Sign In
            </button>
          )}
        </div>
      )}
    </div>
  )

  const hamburger = (
    <button className="sm:hidden p-2" style={{ color: config.link_color ?? '#4b5563' }}
      onClick={() => { if (!menuOpen) setNavHidden(false); setMenuOpen(!menuOpen) }} aria-label="Toggle menu">
      {menuOpen
        ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      }
    </button>
  )

  const headerStyle = {
    background: config.bg_color ?? '#ffffff',
    borderBottom: `1px solid ${config.border_color ?? '#e2e8f0'}`,
  }
  // Mobile is always sticky so the translate-up trick works; sm+ respects config.sticky
  const stickyClass = config.sticky
    ? 'sticky z-50 shadow-sm'
    : 'sticky z-50 sm:static sm:z-auto'
  const logoRowHeights = { standard: 64, compact: 56, 'full-search': 48, 'logo-center': 64 }
  const logoRowHeight  = logoRowHeights[layout] ?? 64
  // Only applies on mobile (navHidden can only be true when innerWidth < 640)
  const mobileTransform = navHidden ? `translateY(-${logoRowHeight}px)` : 'translateY(0)'
  const mobileTop       = navHidden ? '10px' : '0px'

  const loginModalEl = showLoginModal && (
    <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => { setShowLoginModal(false); navigate('/') }} />
  )

  // ── Standard ──────────────────────────────────────────────────────────────
  // Logo left | Search center | Icons right | Links below
  if (layout === 'standard') return (
    <><header style={{ ...headerStyle, transform: mobileTransform, top: mobileTop, transition: 'transform 0.3s ease, top 0.3s ease' }} className={stickyClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Logo config={config} />
          {config.show_search && <SearchBar className="hidden sm:block flex-1 max-w-xl" />}
          <div className="flex items-center gap-1">
            <NavIcons config={config} onAccount={handleAccount} user={user} isAuthenticated={isAuthenticated} onLogout={logout} />
            {hamburger}
          </div>
        </div>
        {config.show_search && <MobileSearchBar />}
        <LinksRow links={allLinks} config={config} />
      </div>
      {mobileDrawer}
    </header>{loginModalEl}</>
  )

  // ── Compact ───────────────────────────────────────────────────────────────
  // All in one row: Logo · Links · SearchIcon · Icons
  if (layout === 'compact') return (
    <><header style={{ ...headerStyle, transform: mobileTransform, top: mobileTop, transition: 'transform 0.3s ease, top 0.3s ease' }} className={stickyClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          <Logo config={config} />
          <nav className="hidden sm:flex items-center gap-5 flex-1 overflow-x-auto no-scrollbar">
            {allLinks.map(link => (
              <a key={link.key} href={link.href}
                className="text-sm font-medium whitespace-nowrap transition"
                style={{ color: config.link_color ?? '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = config.link_hover_color ?? '#ffcc01' }}
                onMouseLeave={e => { e.currentTarget.style.color = config.link_color ?? '#4b5563' }}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {config.show_search && <SearchIconButton color={config.link_color ?? '#4b5563'} />}
            <NavIcons config={config} onAccount={handleAccount} user={user} isAuthenticated={isAuthenticated} onLogout={logout} />
            {hamburger}
          </div>
        </div>
        {/* Mobile search */}
        {config.show_search && <MobileSearchBar />}
      </div>
      {mobileDrawer}
    </header>{loginModalEl}</>
  )

  // ── Full Search ───────────────────────────────────────────────────────────
  // Logo + Icons top | Search bar full-width | Links
  if (layout === 'full-search') return (
    <><header style={{ ...headerStyle, transform: mobileTransform, top: mobileTop, transition: 'transform 0.3s ease, top 0.3s ease' }} className={stickyClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 gap-4">
          <Logo config={config} />
          <div className="flex items-center gap-1">
            <NavIcons config={config} onAccount={handleAccount} user={user} isAuthenticated={isAuthenticated} onLogout={logout} />
            {hamburger}
          </div>
        </div>
        {config.show_search && (
          <div className="pb-3">
            <SearchBar className="w-full" />
          </div>
        )}
        <LinksRow links={allLinks} config={config} />
      </div>
      {mobileDrawer}
    </header>{loginModalEl}</>
  )

  // ── Logo Center ───────────────────────────────────────────────────────────
  // Search left | Logo centered (absolute) | Icons right | Links below
  if (layout === 'logo-center') return (
    <><header style={{ ...headerStyle, transform: mobileTransform, top: mobileTop, transition: 'transform 0.3s ease, top 0.3s ease' }} className={stickyClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16 gap-4">
          {/* Left: search */}
          <div className="flex-1 hidden sm:block">
            {config.show_search && <SearchBar className="max-w-xs" />}
          </div>
          {/* Center: logo (absolute so it's truly centered) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo config={config} />
          </div>
          {/* Right: icons */}
          <div className="flex-1 flex justify-end items-center gap-1">
            <NavIcons config={config} onAccount={handleAccount} user={user} isAuthenticated={isAuthenticated} onLogout={logout} />
            {hamburger}
          </div>
        </div>
        {config.show_search && <MobileSearchBar />}
        <LinksRow links={allLinks} config={config} />
      </div>
      {mobileDrawer}
    </header>{loginModalEl}</>
  )

  return null
}

