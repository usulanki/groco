import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const SCREEN_W = Dimensions.get('window').width

const STATUS_LABEL: Record<string, string> = {
  order_placed: 'Order Placed',
  pending:      'Pending',
  confirmed:    'Confirmed',
  shipped:      'Out for Delivery',
  delivered:    'Delivered',
  cancelled:    'Cancelled',
}

export interface ActiveOrder {
  id:        number
  status:    string
  itemCount: number
}

interface Props {
  orders: ActiveOrder[]
}

export default function ActiveOrderBar({ orders }: Props) {
  const router   = useRouter()
  const [index, setIndex] = useState(0)
  const opacity  = useRef(new Animated.Value(1)).current
  const slideX   = useRef(new Animated.Value(0)).current

  const total = orders.length

  useEffect(() => {
    if (total <= 1) return
    const interval = setInterval(() => {
      // Slide out to left + fade
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideX,  { toValue: -20, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setIndex(i => (i + 1) % total)
        slideX.setValue(20)
        // Slide in from right + fade in
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(slideX,  { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start()
      })
    }, 6000)
    return () => clearInterval(interval)
  }, [total])

  if (total === 0) return null

  const order = orders[index]

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.85}
      onPress={() => router.push(`/order/${orders[index].id}` as any)}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="bag-check-outline" size={20} color="#1a1a1a" />
      </View>

      <View style={styles.textBlock}>
        <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
          <Text style={styles.title}>{STATUS_LABEL[order.status] ?? order.status}</Text>
          <Text style={styles.sub}>
            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {total > 1 && (
          <View style={styles.dots}>
            {orders.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={16} color="#1a1a1a" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bar: {
    width: SCREEN_W * 0.58,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,200,0.7)',
    borderRadius: 36,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,204,1,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,204,1,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#f59e0b',
    width: 10,
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255,204,1,0.45)',
    backgroundColor: 'rgba(255,204,1,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
