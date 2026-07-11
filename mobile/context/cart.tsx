import { createContext, useContext, useState, type ReactNode } from 'react'

export interface CartItem {
  id:        string        // `${productId}_${variantId ?? 'base'}`
  productId: number
  variantId: number | null
  name:      string
  image:     string | null
  price:     number
  uom:       string | null
  qty:       number
}

interface CartContextType {
  items:      CartItem[]
  addItem:    (item: Omit<CartItem, 'qty'>) => void
  updateQty:  (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart:  () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType>({
  items:      [],
  addItem:    () => {},
  updateQty:  () => {},
  removeItem: () => {},
  clearCart:  () => {},
  totalItems: 0,
  totalPrice: 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(item: Omit<CartItem, 'qty'>) {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function updateQty(id: string, qty: number) {
    setItems(prev =>
      qty <= 0
        ? prev.filter(i => i.id !== id)
        : prev.map(i => i.id === id ? { ...i, qty } : i)
    )
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
