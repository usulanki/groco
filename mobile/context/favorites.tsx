import { createContext, useContext, useState, type ReactNode } from 'react'

interface FavoritesContextValue {
  ids: Set<number>
  toggle: (id: number) => void
  isFav: (id: number) => boolean
}

const FavoritesContext = createContext<FavoritesContextValue>({
  ids: new Set(),
  toggle: () => {},
  isFav: () => false,
})

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <FavoritesContext.Provider value={{ ids, toggle, isFav: id => ids.has(id) }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
