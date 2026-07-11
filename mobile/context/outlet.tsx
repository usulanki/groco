import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as Location from 'expo-location'
import { outletsApi, type NearbyOutlet } from '@/lib/api'

type ServiceState = 'loading' | 'serviceable' | 'not-serviceable'

interface OutletContextValue {
  serviceState: ServiceState
  outletIds: number[]         // ordered nearest → farthest
  nearbyOutlets: NearbyOutlet[]
  deviceLocation: string | null
}

const OutletContext = createContext<OutletContextValue>({
  serviceState: 'loading',
  outletIds: [],
  nearbyOutlets: [],
  deviceLocation: null,
})

export function OutletProvider({ children }: { children: ReactNode }) {
  const [permission] = Location.useForegroundPermissions()
  const [serviceState, setServiceState] = useState<ServiceState>('loading')
  const [outletIds, setOutletIds]       = useState<number[]>([])
  const [nearbyOutlets, setNearbyOutlets] = useState<NearbyOutlet[]>([])
  const [deviceLocation, setDeviceLocation] = useState<string | null>(null)

  useEffect(() => {
    if (!permission?.granted) return
    let cancelled = false

    async function init() {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (cancelled) return

        // Reverse geocode (non-blocking)
        Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          .then(([place]) => {
            if (cancelled || !place) return
            const area = place.district ?? place.subregion ?? place.name ?? ''
            const city = place.city ?? place.region ?? ''
            setDeviceLocation([area, city].filter(Boolean).join(', '))
          })
          .catch(() => {})

        const result = await outletsApi.nearby(pos.coords.latitude, pos.coords.longitude)
        if (cancelled) return

        setNearbyOutlets(result.outlets)
        setOutletIds(result.outlets.map(o => o.id))
        setServiceState(result.serviceable ? 'serviceable' : 'not-serviceable')
      } catch {
        if (!cancelled) setServiceState('serviceable') // fail open
      }
    }

    init()
    return () => { cancelled = true }
  }, [permission?.granted])

  return (
    <OutletContext.Provider value={{ serviceState, outletIds, nearbyOutlets, deviceLocation }}>
      {children}
    </OutletContext.Provider>
  )
}

export function useOutlet() {
  return useContext(OutletContext)
}
