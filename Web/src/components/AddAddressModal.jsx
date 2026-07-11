import { useState, useEffect } from 'react'
import { X, MapPin, Navigation, Loader2 } from 'lucide-react'
import { addressApi, locationsApi } from '../lib/api'

const LABEL_OPTIONS = ['Home', 'Work', 'Hotel', 'Other']
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

export default function AddAddressModal({ open, onClose, onSaved }) {
  const [label,     setLabel]     = useState('Home')
  const [flat,      setFlat]      = useState('')
  const [floor,     setFloor]     = useState('')
  const [area,      setArea]      = useState('')
  const [landmark,  setLandmark]  = useState('')
  const [firstName, setFirstName] = useState('')
  const [phone,     setPhone]     = useState('')
  const [stateId,   setStateId]   = useState('')
  const [cityId,    setCityId]    = useState('')
  const [pincode,   setPincode]   = useState('')
  const [states,    setStates]    = useState([])
  const [cities,    setCities]    = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [coords,    setCoords]    = useState(null)
  const [locLabel,  setLocLabel]  = useState('')
  const [locating,  setLocating]  = useState(false)

  useEffect(() => {
    if (!open) return
    resetForm()
    locationsApi.states().then(setStates).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!stateId) { setCities([]); setCityId(''); return }
    locationsApi.cities(stateId).then(setCities).catch(() => {})
  }, [stateId])

  function resetForm() {
    setLabel('Home'); setFlat(''); setFloor(''); setArea(''); setLandmark('')
    setFirstName(''); setPhone(''); setStateId(''); setCityId(''); setPincode('')
    setError(''); setCoords(null); setLocLabel('')
  }

  function goToCurrentLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCoords({ lat: latitude, lng: longitude })
        try {
          const res  = await fetch(`${NOMINATIM}?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'Accept-Language': 'en' } })
          const data = await res.json()
          const a    = data.address ?? {}
          const detected = [a.suburb, a.city || a.town || a.village, a.state].filter(Boolean).join(', ')
          setLocLabel(detected)
          if (!area) setArea(detected)
        } catch {}
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  async function handleSave() {
    if (!flat || !stateId || !cityId || !pincode) {
      setError('Please fill building name, state, city and pincode')
      return
    }
    setSaving(true)
    setError('')
    try {
      const address2Parts = [floor, area, landmark].filter(Boolean).join(', ')
      await addressApi.create({
        address1: flat,
        address2: address2Parts || undefined,
        city_id:  Number(cityId),
        state_id: Number(stateId),
        pincode,
      })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save address')
    }
    setSaving(false)
  }

  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.008},${coords.lat - 0.008},${coords.lng + 0.008},${coords.lat + 0.008}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=72.8,18.9,72.9,19.0&layer=mapnik`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Left — Map */}
        <div className="w-1/2 relative bg-gray-200 hidden sm:block">
          <iframe
            src={mapSrc}
            className="w-full h-full border-0"
            title="Delivery location map"
          />

          <button
            onClick={goToCurrentLocation}
            disabled={locating}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {locating
              ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              : <Navigation className="w-4 h-4 text-blue-500" />
            }
            Go to current location
          </button>

          {locLabel && (
            <div className="absolute bottom-4 left-3 right-3 bg-white rounded-xl px-3 py-2 shadow-md flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs text-gray-700 truncate">{locLabel}</span>
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-bold text-gray-800">Enter complete address</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {/* Save address as */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Save address as</p>
              <div className="flex gap-2 flex-wrap">
                {LABEL_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setLabel(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      label === opt
                        ? 'border-[#ffcc01] text-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400'
                    }`}
                    style={label === opt ? { backgroundColor: '#ffcc01' } : {}}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <input
              value={flat}
              onChange={e => setFlat(e.target.value)}
              placeholder="Flat / House no / Building name *"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <input
              value={floor}
              onChange={e => setFloor(e.target.value)}
              placeholder="Floor (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="Area / Sector / Locality"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <input
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder="Nearby landmark (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <select
              value={stateId}
              onChange={e => setStateId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-700"
            >
              <option value="">Select state *</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select
              value={cityId}
              onChange={e => setCityId(e.target.value)}
              disabled={!stateId}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-700 disabled:opacity-50"
            >
              <option value="">Select city *</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <input
              value={pincode}
              onChange={e => setPincode(e.target.value)}
              placeholder="Pincode *"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <p className="text-[10px] text-gray-400 font-medium text-center shrink-0">
                Enter your details for seamless delivery experience
              </p>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Your phone number (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>

          {/* Save button */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
