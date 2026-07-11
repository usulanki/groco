import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserAddress } from '@/lib/api'

interface AddressContextType {
  selectedAddress: UserAddress | null
  setSelectedAddress: (a: UserAddress | null) => void
}

const AddressContext = createContext<AddressContextType>({
  selectedAddress:    null,
  setSelectedAddress: () => {},
})

export function AddressProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)

  return (
    <AddressContext.Provider value={{ selectedAddress, setSelectedAddress }}>
      {children}
    </AddressContext.Provider>
  )
}

export function useAddress() {
  return useContext(AddressContext)
}
