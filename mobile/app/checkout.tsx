import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { cmsApi, ordersApi, outletsApi, DEFAULT_PAYMENT_CONFIG, type PaymentScreenConfig } from '@/lib/api'
import { useCart } from '@/context/cart'
import { useAuth } from '@/context/auth'
import { useAddress } from '@/context/address'
import LocationModal from '@/components/LocationModal'

// ─── Gateway definitions ───────────────────────────────────────────────────────

const GATEWAYS: {
  key: keyof PaymentScreenConfig
  label: string
  bg: string
  color: string
  modes: string[]
}[] = [
  { key: 'gateway_razorpay', label: 'Razorpay', bg: '#2d68ff', color: '#fff', modes: ['UPI', 'Cards', 'Wallets', 'Net Banking', 'COD'] },
  { key: 'gateway_stripe',   label: 'Stripe',   bg: '#635bff', color: '#fff', modes: ['Cards', 'Wallets'] },
  { key: 'gateway_payu',     label: 'PayU',     bg: '#ff6600', color: '#fff', modes: ['UPI', 'Cards', 'Wallets', 'Net Banking'] },
  { key: 'gateway_cashfree', label: 'Cashfree', bg: '#00c853', color: '#fff', modes: ['UPI', 'Cards', 'Wallets', 'Net Banking', 'COD'] },
  { key: 'gateway_paytm',    label: 'Paytm',    bg: '#00baf2', color: '#fff', modes: ['UPI', 'Wallets', 'Cards'] },
  { key: 'gateway_phonepe',  label: 'PhonePe',  bg: '#5f259f', color: '#fff', modes: ['UPI', 'Wallets'] },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter()
  const { items, totalPrice, totalItems, clearCart } = useCart()
  const { isLoggedIn, token } = useAuth()
  const { selectedAddress } = useAddress()

  const [cfg, setCfg] = useState<PaymentScreenConfig>(DEFAULT_PAYMENT_CONFIG)
  const [configLoading, setConfigLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null)
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null)
  const [loadingDelivery, setLoadingDelivery] = useState(false)

  useEffect(() => {
    cmsApi.getAppPaymentScreen()
      .then(res => { if (res.config) setCfg(res.config) })
      .catch(() => {})
      .finally(() => setConfigLoading(false))
  }, [])

  // Fetch delivery charge estimate whenever address changes
  useEffect(() => {
    let cancelled = false
    async function fetchEstimate() {
      setLoadingDelivery(true)
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        let lat: number | undefined
        let lng: number | undefined
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        }
        if (lat == null || lng == null) { setDeliveryCharge(0); return }
        const estimate = await outletsApi.deliveryEstimate(lat, lng)
        if (!cancelled) setDeliveryCharge(estimate.delivery_charge)
      } catch {
        if (!cancelled) setDeliveryCharge(0)
      } finally {
        if (!cancelled) setLoadingDelivery(false)
      }
    }
    fetchEstimate()
    return () => { cancelled = true }
  }, [selectedAddress])

  const activeGateways = GATEWAYS.filter(g => cfg[g.key] === true)

  useEffect(() => {
    if (activeGateways.length > 0 && !selectedGateway) {
      setSelectedGateway(activeGateways[0].key as string)
    }
  }, [activeGateways.length])

  async function handlePay() {
    if (items.length === 0) {
      Alert.alert('Empty cart', 'Add items to your cart before checking out.')
      return
    }

    if (!selectedAddress) {
      Alert.alert('No address', 'Please select a delivery address before proceeding.', [
        { text: 'Select address', onPress: () => setAddressModalVisible(true) },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }

    if (!isLoggedIn || !token) {
      Alert.alert('Login required', 'Please log in to continue with payment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ])
      return
    }

    setPaying(true)
    try {
      // Best-effort location stamp — silently skip if permission denied
      let latitude: number | undefined
      let longitude: number | undefined
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          latitude  = pos.coords.latitude
          longitude = pos.coords.longitude
        }
      } catch {}

      await ordersApi.create({
        items: items.map(i => ({
          product_id: i.productId,
          variant_id: i.variantId ?? null,
          quantity:   i.qty,
        })),
        addressId: selectedAddress?.id,
        latitude,
        longitude,
      })
      clearCart()
      router.replace('/order-success')
    } catch (err: any) {
      Alert.alert('Order failed', err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (configLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ffcc01" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: cfg.bg_color }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cfg.card_bg, borderBottomColor: cfg.divider_color }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <Text style={styles.headerSub}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Delivery address ── */}
        {cfg.show_delivery_address && (
          <View style={[styles.card, { backgroundColor: cfg.card_bg, borderColor: cfg.divider_color }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: cfg.address_heading_color }]}>Deliver to</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <Text style={[styles.changeBtn, { color: cfg.address_edit_color }]}>Change</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addressRow}
              onPress={() => setAddressModalVisible(true)}
            >
              <View style={styles.addressIconWrap}>
                <Ionicons name="location-sharp" size={16} color="#3b82f6" />
              </View>
              {selectedAddress ? (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressName, { color: cfg.address_heading_color }]}>
                    {selectedAddress.address1}
                  </Text>
                  <Text style={[styles.addressLine, { color: cfg.address_text_color }]}>
                    {[selectedAddress.address2, selectedAddress.City?.name, selectedAddress.State?.name, selectedAddress.pincode]
                      .filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressName, { color: cfg.address_heading_color }]}>No address selected</Text>
                  <Text style={[styles.addressLine, { color: cfg.address_edit_color }]}>
                    Tap to select a delivery address
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Order summary ── */}
        {cfg.show_order_summary && (
          <View style={[styles.card, { backgroundColor: cfg.card_bg, borderColor: cfg.divider_color }]}>
            <Text style={[styles.cardTitle, { color: cfg.summary_heading_color, marginBottom: 12 }]}>
              Order Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: cfg.summary_label_color }]}>
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </Text>
              <Text style={[styles.summaryValue, { color: cfg.summary_value_color }]}>
                ₹{totalPrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: cfg.summary_label_color }]}>Delivery</Text>
              {loadingDelivery ? (
                <ActivityIndicator size="small" color="#6b7280" />
              ) : deliveryCharge === 0 ? (
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>FREE</Text>
              ) : (
                <Text style={[styles.summaryValue, { color: cfg.summary_value_color }]}>
                  ₹{(deliveryCharge ?? 0).toFixed(2)}
                </Text>
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: cfg.divider_color }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotal, { color: cfg.total_color }]}>Total</Text>
              <Text style={[styles.summaryTotalVal, { color: cfg.total_color }]}>
                ₹{(totalPrice + (deliveryCharge ?? 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Apply coupon ── */}
        <View style={[styles.card, { backgroundColor: cfg.card_bg, borderColor: cfg.divider_color }]}>
          <Text style={[styles.cardTitle, { color: cfg.summary_heading_color, marginBottom: 10 }]}>
            Apply Coupon
          </Text>
          <View style={styles.couponRow}>
            <Ionicons name="pricetag-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
            <Text style={[styles.couponInput, { color: '#9ca3af', flex: 1 }]}>Enter coupon code</Text>
            <TouchableOpacity>
              <Text style={[styles.couponApply, { color: cfg.active_gateway_border }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Payment gateways ── */}
        <View style={[styles.card, { backgroundColor: cfg.card_bg, borderColor: cfg.divider_color }]}>
          <Text style={[styles.cardTitle, { color: cfg.gateway_heading_color, marginBottom: 12 }]}>
            Payment Gateway
          </Text>

          {activeGateways.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 }}>
              No payment gateways enabled
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {activeGateways.map(gw => {
                const isActive = selectedGateway === gw.key
                return (
                  <TouchableOpacity
                    key={gw.key as string}
                    activeOpacity={0.85}
                    onPress={() => setSelectedGateway(gw.key as string)}
                    style={[
                      styles.gatewayCard,
                      {
                        backgroundColor: isActive ? cfg.active_gateway_bg : cfg.card_bg,
                        borderColor: isActive ? cfg.active_gateway_border : cfg.divider_color,
                      },
                    ]}
                  >
                    <View style={[
                      styles.radioDot,
                      { borderColor: isActive ? cfg.active_dot_color : cfg.inactive_dot_color },
                    ]}>
                      {isActive && (
                        <View style={[styles.radioDotInner, { backgroundColor: cfg.active_dot_color }]} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.gatewayNameRow}>
                        <View style={[styles.gatewayBadge, { backgroundColor: gw.bg }]}>
                          <Text style={[styles.gatewayBadgeText, { color: gw.color }]}>{gw.label}</Text>
                        </View>
                        <Text style={[styles.gatewayName, { color: cfg.gateway_label_color }]}>{gw.label}</Text>
                      </View>
                      <View style={styles.modeChips}>
                        {gw.modes.map((mode, i) => (
                          <Text key={mode} style={[styles.modeChipText, { color: cfg.gateway_mode_color }]}>
                            {i > 0 && <Text style={styles.modeDot}> · </Text>}{mode}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        {/* ── Security note ── */}
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
          <Text style={styles.secureText}>100% secure payments · SSL encrypted</Text>
        </View>
      </ScrollView>

      {/* ── Pay button ── */}
      <SafeAreaView
        edges={['bottom']}
        style={[styles.footer, { backgroundColor: cfg.card_bg, borderTopColor: cfg.divider_color }]}
      >
        <View style={styles.footerTotal}>
          <Text style={[styles.footerTotalLabel, { color: cfg.summary_label_color }]}>Total</Text>
          <Text style={[styles.footerTotalVal, { color: cfg.total_color }]}>
            ₹{(totalPrice + (deliveryCharge ?? 0)).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={paying}
          onPress={handlePay}
          style={[styles.payBtn, { backgroundColor: cfg.pay_bg, borderRadius: cfg.pay_radius, opacity: paying ? 0.7 : 1 }]}
        >
          {paying ? (
            <ActivityIndicator size="small" color={cfg.pay_color} />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color={cfg.pay_color} />
              <Text style={[styles.payBtnText, { color: cfg.pay_color }]}>{cfg.pay_label}</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <LocationModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#6b7280', marginRight: 8 },

  card: {
    marginHorizontal: 12, marginTop: 10, borderRadius: 16, borderWidth: 1, padding: 16,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  changeBtn: { fontSize: 12, fontWeight: '600' },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressIconWrap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  addressName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  addressLine: { fontSize: 12, lineHeight: 18 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  summaryTotal: { fontSize: 14, fontWeight: '700' },
  summaryTotalVal: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, marginVertical: 8 },

  couponRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  couponInput: { fontSize: 13 },
  couponApply: { fontSize: 13, fontWeight: '700' },

  gatewayCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5,
  },
  radioDot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  radioDotInner: { width: 8, height: 8, borderRadius: 4 },
  gatewayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  gatewayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  gatewayBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  gatewayName: { fontSize: 14, fontWeight: '600' },
  modeChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  modeDot: { color: '#d1d5db' },
  modeChipText: { fontSize: 12 },

  secureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, marginBottom: 30,
  },
  secureText: { fontSize: 11, color: '#6b7280' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12,
  },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerTotalLabel: { fontSize: 13, fontWeight: '500' },
  footerTotalVal: { fontSize: 20, fontWeight: '800' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, marginBottom: 4,
  },
  payBtnText: { fontSize: 15, fontWeight: '700' },
})
