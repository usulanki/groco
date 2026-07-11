import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import CmsHomepage from './components/cms/CmsHomepage'
import CmsCategoryPage from './components/cms/CmsCategoryPage'
import CmsProductDetailPage from './components/cms/CmsProductDetailPage'
import CmsLoginPage from './components/cms/CmsLoginPage'
import CmsCartPage from './components/cms/CmsCartPage'
import CmsCheckoutPage from './components/cms/CmsCheckoutPage'
import CmsPaymentPage from './components/cms/CmsPaymentPage'
import CmsAnnouncementBar from './components/cms/CmsAnnouncementBar'
import CmsNavbarShell from './components/cms/CmsNavbarShell'
import Footer from './components/Footer'
import RegisterPage from './pages/RegisterPage'
import AccountPage from './pages/AccountPage'
import SearchPage from './pages/SearchPage'
import CartDrawer from './components/CartDrawer'
import ActiveOrderTracker from './components/ActiveOrderTracker'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <ScrollToTop />
        <CmsAnnouncementBar />
        <CmsNavbarShell />
        <main>
          <Routes>
            <Route path="/" element={<CmsHomepage />} />
            <Route path="/category/:slug" element={<CmsCategoryPage />} />
            <Route path="/product/:id" element={<CmsProductDetailPage />} />
            <Route path="/login" element={<CmsLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/checkout" element={<CmsCheckoutPage />} />
            <Route path="/payment"  element={<CmsPaymentPage />} />
            <Route path="/search"   element={<SearchPage />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <ActiveOrderTracker />
      </div>
    </BrowserRouter>
  )
}
