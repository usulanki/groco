import { createContext, useContext, useState } from 'react'

const CartDrawerContext = createContext(null)

export function CartDrawerProvider({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <CartDrawerContext.Provider value={{
      open,
      openDrawer:  () => setOpen(true),
      closeDrawer: () => setOpen(false),
    }}>
      {children}
    </CartDrawerContext.Provider>
  )
}

export function useCartDrawer() {
  return useContext(CartDrawerContext)
}
