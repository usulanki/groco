import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { useCartDrawer } from '../lib/cartDrawer'

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

function formatAddress(addr) {
  const city     = addr.city || addr.town || addr.village || addr.suburb || addr.county || ''
  const state    = addr.state || ''
  const postcode = addr.postcode || ''
  const country  = addr.country || ''
  return [city, state && postcode ? `${state} ${postcode}` : state || postcode, country]
    .filter(Boolean)
    .join(', ')
}

// ─── Location element ─────────────────────────────────────────────────────────

function LocationPicker() {
  const [address, setAddress]   = useState(() => localStorage.getItem('groco_location') || '')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (!address) requestLocation()
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) { setError(true); return }
    setLoading(true)
    setError(false)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(`${NOMINATIM}?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'Accept-Language': 'en' },
          })
          const data = await res.json()
          const formatted = formatAddress(data.address ?? {})
          setAddress(formatted)
          localStorage.setItem('groco_location', formatted)
        } catch {
          setError(true)
        }
        setLoading(false)
      },
      () => { setError(true); setLoading(false) }
    )
  }

  return (
    <button
      onClick={requestLocation}
      className="flex items-start gap-1.5 text-left shrink-0 group"
      title={address || 'Add your location'}
    >
      {/* Pin icon */}
      <svg className="w-4 h-4 mt-0.5 text-brand-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>

      <div className="min-w-0">
        <p className="text-base font-extrabold text-gray-900 leading-tight whitespace-nowrap mt-[3px]">
          Delivery in 8 minutes
        </p>
        <div className="flex items-center gap-0.5 mt-0.5">
          {loading ? (
            <span className="text-xs text-gray-400">Detecting location…</span>
          ) : error && !address ? (
            <span className="text-xs text-gray-900 underline">Allow location</span>
          ) : (
            <span className="text-xs text-gray-900 max-w-[140px] truncate">
              {address || 'Add your location'}
            </span>
          )}
          <svg className="w-3 h-3 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { openDrawer } = useCartDrawer()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { cartCount } = useCart()
  const [menuOpen, setMenuOpen]           = useState(false)
  const [accountOpen, setAccountOpen]     = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const accountRef = useRef(null)
  const [searchParams] = useSearchParams()

  const isSearchPage = pathname === '/search'
  const searchExpanded = searchFocused || isSearchPage

  // Keep input in sync with URL when on the search page
  useEffect(() => {
    if (isSearchPage) setSearchQuery(searchParams.get('q') ?? '')
    else setSearchQuery('')
  }, [isSearchPage, searchParams])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearchQuery(val)
    if (val.trim()) navigate(`/search?q=${encodeURIComponent(val.trim())}`, { replace: isSearchPage })
    else navigate('/search', { replace: true })
  }

  useEffect(() => {
    if (!accountOpen) return
    function handler(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountOpen])

  function handleAccountClick() {
    if (isAuthenticated) setAccountOpen(o => !o)
    else navigate('/login')
  }

  function handleLogout() {
    logout()
    setAccountOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <a href="/" className="flex-shrink-0 flex items-center gap-1.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-black text-sm">G</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900">Groco</span>
          </a>

          {/* Location — desktop */}
          <div className={`hidden sm:block border-l border-gray-200 pl-4 transition-all duration-300 overflow-hidden ${searchExpanded ? 'max-w-0 opacity-0 border-l-0 pl-0' : 'max-w-xs opacity-100'}`}>
            <LocationPicker />
          </div>

          {/* Search — desktop */}
          <div className={`hidden sm:flex flex-1 rounded-[9px] transition-all duration-300 ${searchExpanded ? 'bg-white shadow-md' : ''}`}>
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products, brands and categories..."
                className="w-full bg-gray-100 border border-gray-200 rounded-[7px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                onFocus={() => { setSearchFocused(true); if (!isSearchPage) navigate('/search') }}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* Account */}
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                onClick={handleAccountClick}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-500 transition"
              >
                {isAuthenticated ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
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
              {accountOpen && isAuthenticated && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.fname} {user.lname}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <a href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">My Account</a>
                  <a href="/account?tab=orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Orders</a>
                  <a href="/account?tab=wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Wishlist</a>
                  <a href="/account?tab=coupons" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">Coupons</a>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={openDrawer} className="relative p-2 text-gray-700 hover:text-brand-500 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger */}
            <button
              className="sm:hidden p-2 text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile: search + location row */}
        <div className="sm:hidden pb-3 space-y-2">
          <LocationPicker />
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="w-full bg-gray-100 border border-gray-200 rounded-[7px] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:shadow-md transition"
              onFocus={() => { if (!isSearchPage) navigate('/search') }}
            />
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4">
          <div className="pt-1">
            {isAuthenticated ? (
              <>
                <a href="/account" onClick={() => setMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition">My Account</a>
                <a href="/account?tab=orders" onClick={() => setMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition">Orders</a>
                <a href="/account?tab=wishlist" onClick={() => setMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition">Wishlist</a>
                <a href="/account?tab=coupons" onClick={() => setMenuOpen(false)} className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition">Coupons</a>
                <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition">Logout</button>
              </>
            ) : (
              <a href="/login" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition">Sign In</a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
