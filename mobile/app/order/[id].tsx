import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ordersApi, type PlacedOrder } from '@/lib/api'
import { orderEvents } from '@/lib/orderEvents'

// Lazy-load react-native-maps (unavailable in Expo Go)
let MapView: any = null
let Marker: any = null
try {
  const maps = require('react-native-maps')
  MapView = maps.default
  Marker  = maps.Marker
} catch {}

const { width: SCREEN_W } = Dimensions.get('window')
const MAP_HEIGHT = 220

const STATUS_LABEL: Record<string, string> = {
  order_placed: 'Order Placed',
  pending:      'Pending',
  confirmed:    'Confirmed',
  shipped:      'Out for Delivery',
  delivered:    'Delivered',
  cancelled:    'Cancelled',
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  order_placed: { bg: '#eff6ff', text: '#1d4ed8' },
  pending:      { bg: '#fef9c3', text: '#92400e' },
  confirmed:    { bg: '#dcfce7', text: '#166534' },
  shipped:      { bg: '#f0fdf4', text: '#15803d' },
  delivered:    { bg: '#f0fdf4', text: '#15803d' },
  cancelled:    { bg: '#fef2f2', text: '#b91c1c' },
}

export default function OrderDetailScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { id }  = useLocalSearchParams<{ id: string }>()

  const [order,      setOrder]      = useState<PlacedOrder | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const loadOrder = useCallback((isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    ordersApi.getById(Number(id))
      .then(data => {
        setOrder(data)
        if (isRefresh) orderEvents.emit()
      })
      .catch(e => setError(e.message ?? 'Failed to load order'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  const isDelivered = order?.order_status === 'delivered'

  const outlet    = order?.Outlet
  const outletLat = Number(outlet?.latitude)
  const outletLng = Number(outlet?.longitude)
  const hasMap    = MapView != null && !isNaN(outletLat) && !isNaN(outletLng) && outletLat !== 0 && outletLng !== 0
  const statusCfg = order ? (STATUS_COLOR[order.order_status] ?? { bg: '#f3f4f6', text: '#374151' }) : null

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Status-bar spacer */}
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffcc01" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : !order ? null : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            !isDelivered ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadOrder(true)}
                colors={['#ffcc01']}
                tintColor="#ffcc01"
              />
            ) : undefined
          }
        >
          {/* Map — hidden when delivered */}
          {!isDelivered && (hasMap ? (
            <MapView
              style={{ width: SCREEN_W, height: MAP_HEIGHT }}
              initialRegion={{
                latitude:       outletLat,
                longitude:      outletLng,
                latitudeDelta:  0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: outletLat, longitude: outletLng }}
                title={outlet!.name}
                description={outlet!.address1 ?? undefined}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="storefront-outline" size={36} color="#d1d5db" />
              <Text style={styles.mapPlaceholderText}>
                {outlet?.name ?? 'Outlet location unavailable'}
              </Text>
            </View>
          ))}

          <View style={{ padding: 16, gap: 12 }}>
            {/* Status + Order no */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.orderNo}>{order.order_no}</Text>
                {statusCfg && (
                  <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.text }]}>
                      {STATUS_LABEL[order.order_status] ?? order.order_status}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateText}>{formatDate(order.created_ts)}</Text>
            </View>

            {/* Outlet info */}
            {outlet && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="storefront-outline" size={16} color="#6b7280" />
                  <Text style={styles.sectionTitle}>Fulfilled by</Text>
                </View>
                <Text style={styles.outletName}>{outlet.name}</Text>
                {(outlet.address1 || outlet.city) && (
                  <Text style={styles.outletAddress}>
                    {[outlet.address1, outlet.city].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
            )}

            {/* Items */}
            {(order.OrderItems?.length ?? 0) > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bag-outline" size={16} color="#6b7280" />
                  <Text style={styles.sectionTitle}>Items</Text>
                </View>
                {order.OrderItems!.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      idx < order.OrderItems!.length - 1 && styles.itemRowBorder,
                    ]}
                  >
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyText}>{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.Product?.name ?? `Product #${item.product_id}`}
                    </Text>
                    <Text style={styles.itemPrice}>₹{Number(item.total ?? item.price * item.quantity).toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Total */}
            <View style={styles.card}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Order Total</Text>
                <Text style={styles.totalValue}>₹{Number(order.total ?? order.order_amount).toFixed(0)}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  mapPlaceholder: {
    width: SCREEN_W,
    height: MAP_HEIGHT,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderNo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  outletName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  outletAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemQtyBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
})
