import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ordersApi, type PlacedOrder } from '@/lib/api'
import { useAuth } from '@/context/auth'

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

function formatDate(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrdersScreen() {
  const router        = useRouter()
  const insets        = useSafeAreaInsets()
  const { isLoggedIn } = useAuth()

  const [orders,     setOrders]     = useState<PlacedOrder[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    ordersApi.getAll()
      .then(setOrders)
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useFocusEffect(useCallback(() => {
    if (!isLoggedIn) { setOrders([]); setLoading(false); return }
    fetchOrders()
  }, [isLoggedIn, fetchOrders]))

  if (!isLoggedIn) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="bag-outline" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
        <Text style={styles.emptyTitle}>Sign in to view orders</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ffcc01" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 38 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={['#ffcc01']}
              tintColor="#ffcc01"
            />
          }
          renderItem={({ item: order }) => {
            const statusCfg = STATUS_COLOR[order.order_status] ?? { bg: '#f3f4f6', text: '#374151' }
            const itemCount = order.OrderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/order/${order.id}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.orderNo}>{order.order_no}</Text>
                  <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.text }]}>
                      {STATUS_LABEL[order.order_status] ?? order.order_status}
                    </Text>
                  </View>
                </View>

                {order.Outlet && (
                  <Text style={styles.outletText} numberOfLines={1}>
                    {order.Outlet.name}
                  </Text>
                )}

                <View style={styles.cardBottom}>
                  <Text style={styles.metaText}>
                    {formatDate(order.created_ts)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.totalText}>₹{Number(order.total ?? order.order_amount).toFixed(0)}</Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#d1d5db"
                  style={styles.chevron}
                />
              </TouchableOpacity>
            )
          }}
        />
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: '#ffcc01',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#ffcc01',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  outletText: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  chevron: {
    position: 'absolute',
    right: 14,
    top: '50%',
  },
})
