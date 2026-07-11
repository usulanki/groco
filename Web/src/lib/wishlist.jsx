import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth'
import { wishlistApi } from './api'

// wishlistSet: Set of product_id numbers that are in the wishlist
const WishlistContext = createContext({
  wishlistSet: new Set(),
  wishlistItems: [],
  toggleWishlist: async () => {},
  loadWishlist: async () => {},
})

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [wishlistItems, setWishlistItems] = useState([])

  const wishlistSet = new Set(wishlistItems.map(item => item.product_id))

  const loadWishlist = useCallback(async () => {
    try {
      const data = await wishlistApi.get()
      setWishlistItems(Array.isArray(data) ? data : [])
    } catch {
      setWishlistItems([])
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistItems([])
      return
    }

    const pending = localStorage.getItem('pendingWishlistItem')
    if (pending) {
      localStorage.removeItem('pendingWishlistItem')
      try {
        const { productId } = JSON.parse(pending)
        wishlistApi.add(productId).finally(loadWishlist)
      } catch {
        loadWishlist()
      }
    } else {
      loadWishlist()
    }
  }, [isAuthenticated, loadWishlist])

  async function toggleWishlist(productId) {
    if (wishlistSet.has(productId)) {
      await wishlistApi.remove(productId)
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
    } else {
      await wishlistApi.add(productId)
      // Reload to get full product data
      loadWishlist()
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistSet, wishlistItems, toggleWishlist, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}
