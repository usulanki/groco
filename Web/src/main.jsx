import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { CartProvider } from './lib/cart.jsx'
import { WishlistProvider } from './lib/wishlist.jsx'
import { CartDrawerProvider } from './lib/cartDrawer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CartDrawerProvider>
              <App />
            </CartDrawerProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
