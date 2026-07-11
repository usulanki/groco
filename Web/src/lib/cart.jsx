import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth'
import { cartApi } from './api'

// cartMap: { [productId]: quantity }
// variantMap: { [productId]: variantId } — tracks which variant is in cart per product
const CartContext = createContext({
  cartMap: {},
  variantMap: {},
  cartCount: 0,
  addItem: async () => {},
  decrementItem: async () => {},
  removeItem: async () => {},
  loadCart: async () => {},
})

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cartMap,    setCartMap]    = useState({})
  const [variantMap, setVariantMap] = useState({})

  const cartCount = Object.values(cartMap).reduce((sum, q) => sum + q, 0)

  const loadCart = useCallback(async () => {
    try {
      const data = await cartApi.get()
      if (Array.isArray(data)) {
        const qMap = {}
        const vMap = {}
        data.forEach(item => {
          qMap[item.product_id] = item.quantity
          if (item.variant_id != null) vMap[item.product_id] = item.variant_id
        })
        setCartMap(qMap)
        setVariantMap(vMap)
      }
    } catch {
      setCartMap({})
      setVariantMap({})
    }
  }, [])

  // On auth change: clear map when logged out; load cart (+ consume any pending
  // item saved before login redirect/modal) when logged in.
  useEffect(() => {
    if (!isAuthenticated) {
      setCartMap({})
      setVariantMap({})
      return
    }

    const pending = localStorage.getItem('pendingCartItem')
    if (pending) {
      localStorage.removeItem('pendingCartItem')
      try {
        const { productId, quantity } = JSON.parse(pending)
        cartApi.add(productId, quantity).finally(loadCart)
      } catch {
        loadCart()
      }
    } else {
      loadCart()
    }
  }, [isAuthenticated, loadCart])

  async function addItem(productId, variantId) {
    await cartApi.add(productId, 1, variantId)
    setCartMap(m => ({ ...m, [productId]: (m[productId] ?? 0) + 1 }))
    if (variantId != null) {
      setVariantMap(m => ({ ...m, [productId]: variantId }))
    }
  }

  async function decrementItem(productId) {
    const qty = cartMap[productId] ?? 0
    if (qty <= 1) {
      await cartApi.remove(productId)
      setCartMap(m => { const n = { ...m }; delete n[productId]; return n })
      setVariantMap(m => { const n = { ...m }; delete n[productId]; return n })
    } else {
      await cartApi.decrement(productId)
      setCartMap(m => ({ ...m, [productId]: m[productId] - 1 }))
    }
  }

  async function removeItem(productId) {
    await cartApi.remove(productId)
    setCartMap(m => { const n = { ...m }; delete n[productId]; return n })
    setVariantMap(m => { const n = { ...m }; delete n[productId]; return n })
  }

  return (
    <CartContext.Provider value={{ cartMap, variantMap, cartCount, addItem, decrementItem, removeItem, loadCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
