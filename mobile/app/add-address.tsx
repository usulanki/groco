import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { addressApi, locationsApi, type StateOption, type CityOption } from '@/lib/api'
import { useAddress } from '@/context/address'

// ─── lazy‐load react-native-maps (not available in Expo Go) ───────────────────
let MapView: any = null
let Marker: any = null
try {
  const maps = require('react-native-maps')
  MapView = maps.default
  Marker = maps.Marker
} catch {}

// ─── Nominatim types ──────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string; suburb?: string; neighbourhood?: string
    city?: string; town?: string; village?: string
    county?: string; state?: string; postcode?: string
    country?: string
  }
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const INDIA_CENTER = { latitude: 20.5937, longitude: 78.9629 }

// ─── Main screen ─────────────────────────────────────────────────────────────
type Step = 'map' | 'form'

export default function AddAddressScreen() {
  const router = useRouter()
  const { setSelectedAddress } = useAddress()
  const [step, setStep] = useState<Step>('map')

  // Map state
  const mapRef = useRef<any>(null)
  const [region, setRegion] = useState({
    ...INDIA_CENTER, latitudeDelta: 10, longitudeDelta: 10,
  })
  const [centerCoord, setCenterCoord] = useState(INDIA_CENTER)
  const [locating, setLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state (pre-filled from reverse geocode)
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [pincode, setPincode] = useState('')
  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [stateId, setStateId] = useState<number | null>(null)
  const [cityId, setCityId] = useState<number | null>(null)
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [showStatePicker, setShowStatePicker] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [statesLoading, setStatesLoading] = useState(false)

  // ─── Load states whenever the form step becomes active ───────────────────
  useEffect(() => {
    if (step !== 'form' || states.length > 0) return
    setStatesLoading(true)
    locationsApi.getStates()
      .then(setStates)
      .catch(() => {})
      .finally(() => setStatesLoading(false))
  }, [step])

  // ─── Search with debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const q = searchQuery.trim()
    if (q.length < 3) { setSuggestions([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`
        const res = await fetch(url, { headers: { 'User-Agent': 'GrocoCom/1.0 u.sulanki@gmail.com' } })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
      } catch {}
      setSearchLoading(false)
    }, 600)
  }, [searchQuery])

  function selectSuggestion(item: NominatimResult) {
    Keyboard.dismiss()
    setSuggestions([])
    setSearchQuery(item.display_name.split(',')[0])
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const newRegion = { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    setRegion(newRegion)
    setCenterCoord({ latitude: lat, longitude: lon })
    mapRef.current?.animateToRegion(newRegion, 600)
  }

  // ─── Current location ─────────────────────────────────────────────────────
  async function handleMyLocation() {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to detect your location.')
        setLocating(false)
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude } = pos.coords
      const newRegion = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      setRegion(newRegion)
      setCenterCoord({ latitude, longitude })
      mapRef.current?.animateToRegion(newRegion, 600)
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.')
    }
    setLocating(false)
  }

  // ─── Confirm map location → reverse geocode → go to form ─────────────────
  async function handleConfirmLocation() {
    setFormLoading(true)
    try {
      const { latitude, longitude } = centerCoord
      const url = `${NOMINATIM}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      const res = await fetch(url, { headers: { 'User-Agent': 'GrocoCom/1.0 u.sulanki@gmail.com' } })
      const data: NominatimResult = await res.json()
      const addr = data.address ?? {}

      const parts = [addr.road, addr.suburb ?? addr.neighbourhood].filter(Boolean)
      setAddress1(parts.join(', ') || data.display_name.split(',')[0])
      setAddress2('')
      setPincode(addr.postcode ?? '')

      // Load states and pre-select if possible
      const stateList = await locationsApi.getStates()
      setStates(stateList)

      const stateName = addr.state ?? ''
      const matchedState = stateList.find(s =>
        s.name.toLowerCase() === stateName.toLowerCase() ||
        stateName.toLowerCase().includes(s.name.toLowerCase())
      )
      if (matchedState) {
        setStateId(matchedState.id)
        setStateSearch(matchedState.name)
        const cityList = await locationsApi.getCities(matchedState.id)
        setCities(cityList)
        const cityName = addr.city ?? addr.town ?? addr.village ?? addr.county ?? ''
        const matchedCity = cityList.find(c =>
          c.name.toLowerCase() === cityName.toLowerCase() ||
          cityName.toLowerCase().includes(c.name.toLowerCase())
        )
        if (matchedCity) {
          setCityId(matchedCity.id)
          setCitySearch(matchedCity.name)
        }
      }
    } catch {
      // reverse geocode failed — states will load via useEffect when step changes
    }
    setFormLoading(false)
    setStep('form')
  }

  // ─── State picker ─────────────────────────────────────────────────────────
  async function handleStateSelect(s: StateOption) {
    setStateId(s.id)
    setStateSearch(s.name)
    setShowStatePicker(false)
    setCityId(null)
    setCitySearch('')
    setCities([])
    try {
      const list = await locationsApi.getCities(s.id)
      setCities(list)
    } catch {}
  }

  // ─── Save address ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!address1.trim()) return Alert.alert('Required', 'Please enter address line 1')
    if (!stateId)         return Alert.alert('Required', 'Please select a state')
    if (!cityId)          return Alert.alert('Required', 'Please select a city')
    if (!pincode.trim())  return Alert.alert('Required', 'Please enter a pincode')

    setSaving(true)
    try {
      const newAddr = await addressApi.create({
        address1: address1.trim(),
        address2: address2.trim() || undefined,
        state_id: stateId,
        city_id: cityId,
        pincode: pincode.trim(),
      })
      setSelectedAddress(newAddr)
      router.back()
    } catch {
      Alert.alert('Error', 'Failed to save address. Please try again.')
    }
    setSaving(false)
  }

  // ─── Map step ────────────────────────────────────────────────────────────
  if (step === 'map') {
    return (
      <View style={{ flex: 1 }}>
        {/* Search bar (absolute, over map) */}
        <SafeAreaView edges={['top']} style={styles.searchSafe}>
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={16} color="#9ca3af" style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for area, street, city…"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchLoading && <ActivityIndicator size="small" color="#ffcc01" style={{ marginRight: 10 }} />}
              {!searchLoading && searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]) }} style={{ marginRight: 10 }}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map(item => (
                <TouchableOpacity
                  key={item.place_id}
                  style={styles.suggestionRow}
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={14} color="#6b7280" style={{ marginTop: 2 }} />
                  <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>

        {/* Map */}
        {MapView ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onRegionChangeComplete={r => setCenterCoord({ latitude: r.latitude, longitude: r.longitude })}
            showsUserLocation
            showsMyLocationButton={false}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noMapFallback]}>
            <Ionicons name="map-outline" size={48} color="#d1d5db" />
            <Text style={styles.noMapText}>Map not available in Expo Go</Text>
            <Text style={styles.noMapSub}>Use a development build to enable map picking</Text>
            <TouchableOpacity style={styles.noMapBtn} onPress={() => setStep('form')}>
              <Text style={styles.noMapBtnText}>Continue to form</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fixed center pin overlay */}
        {MapView && (
          <View style={styles.pinOverlay} pointerEvents="none">
            <View style={styles.pinTop}>
              <Ionicons name="location-sharp" size={40} color="#ef4444" />
            </View>
            <View style={styles.pinShadow} />
          </View>
        )}

        {/* Bottom controls */}
        {MapView && (
          <SafeAreaView edges={['bottom']} style={styles.mapBottomSafe}>
            <View style={styles.mapBottom}>
              <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} disabled={locating}>
                {locating
                  ? <ActivityIndicator size="small" color="#1a1a1a" />
                  : <Ionicons name="locate" size={20} color="#1a1a1a" />
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, formLoading && { opacity: 0.7 }]}
                onPress={handleConfirmLocation}
                disabled={formLoading}
              >
                {formLoading
                  ? <ActivityIndicator color="#1a1a1a" />
                  : <Text style={styles.confirmBtnText}>Confirm location</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    )
  }

  // ─── Form step ────────────────────────────────────────────────────────────
  const filteredStates = states.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
  const filteredCities = cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
  const selectedStateName = states.find(s => s.id === stateId)?.name ?? ''
  const selectedCityName  = cities.find(c => c.id === cityId)?.name ?? ''

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setStep('map')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>Address details</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.fieldLabel}>Address line 1 *</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="House / flat / building, street"
            placeholderTextColor="#9ca3af"
            value={address1}
            onChangeText={setAddress1}
          />

          <Text style={styles.fieldLabel}>Address line 2</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Landmark, colony (optional)"
            placeholderTextColor="#9ca3af"
            value={address2}
            onChangeText={setAddress2}
          />

          {/* State picker */}
          <Text style={styles.fieldLabel}>State *</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => { setShowStatePicker(v => !v); setShowCityPicker(false) }}
          >
            <Text style={[styles.pickerValue, !selectedStateName && { color: '#9ca3af' }]}>
              {selectedStateName || 'Select state'}
            </Text>
            <Ionicons name={showStatePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </TouchableOpacity>
          {showStatePicker && (
            <View style={styles.pickerBox}>
              <View style={styles.pickerSearch}>
                <Ionicons name="search" size={14} color="#9ca3af" />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search states…"
                  placeholderTextColor="#9ca3af"
                  value={stateSearch}
                  onChangeText={setStateSearch}
                  autoFocus
                />
              </View>
              {statesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color="#ffcc01" />
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {filteredStates.map(item => (
                    <TouchableOpacity key={item.id} style={styles.pickerItem} onPress={() => handleStateSelect(item)}>
                      <Text style={[styles.pickerItemText, item.id === stateId && { color: '#f59e0b', fontWeight: '700' }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* City picker */}
          <Text style={styles.fieldLabel}>City *</Text>
          <TouchableOpacity
            style={[styles.pickerTrigger, !stateId && { opacity: 0.5 }]}
            disabled={!stateId}
            onPress={() => { setShowCityPicker(v => !v); setShowStatePicker(false) }}
          >
            <Text style={[styles.pickerValue, !selectedCityName && { color: '#9ca3af' }]}>
              {selectedCityName || (stateId ? 'Select city' : 'Select state first')}
            </Text>
            <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </TouchableOpacity>
          {showCityPicker && (
            <View style={styles.pickerBox}>
              <View style={styles.pickerSearch}>
                <Ionicons name="search" size={14} color="#9ca3af" />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search cities…"
                  placeholderTextColor="#9ca3af"
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoFocus
                />
              </View>
              <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {filteredCities.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.pickerItem}
                    onPress={() => { setCityId(item.id); setCitySearch(item.name); setShowCityPicker(false) }}
                  >
                    <Text style={[styles.pickerItemText, item.id === cityId && { color: '#f59e0b', fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.fieldLabel}>Pincode *</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="6-digit pincode"
            placeholderTextColor="#9ca3af"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#1a1a1a" />
              : <Text style={styles.saveBtnText}>Save address</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── map step ──────────────────────────────────────────────────────────────
  searchSafe: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3,
    elevation: 3,
  },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1, paddingHorizontal: 8, paddingVertical: 10,
    fontSize: 14, color: '#1a1a1a',
  },
  suggestionsBox: {
    marginHorizontal: 12, marginTop: 4,
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6,
    elevation: 4, overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  suggestionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  pinOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  pinTop: { marginBottom: -4 },
  pinShadow: {
    width: 10, height: 4, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.2)',
  },

  mapBottomSafe: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  mapBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 8,
  },
  myLocationBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: '#ffcc01',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

  noMapFallback: {
    alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f3f4f6',
  },
  noMapText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  noMapSub: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 32 },
  noMapBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#ffcc01', borderRadius: 10,
  },
  noMapBtnText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },

  // ── form step ─────────────────────────────────────────────────────────────
  formHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  formScroll: { padding: 20, gap: 0 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1a1a1a',
  },

  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerValue: { fontSize: 14, color: '#1a1a1a' },
  pickerBox: {
    marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, overflow: 'hidden',
  },
  pickerSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  pickerSearchInput: { flex: 1, fontSize: 13, color: '#1a1a1a', paddingVertical: 2 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  pickerItemText: { fontSize: 14, color: '#374151' },

  saveBtn: {
    marginTop: 32, height: 52, borderRadius: 12,
    backgroundColor: '#ffcc01',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
})
