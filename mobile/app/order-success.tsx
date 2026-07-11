import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function OrderSuccessScreen() {
  const router  = useRouter()
  const scale   = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const bounce  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1. Pop in
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Continuous gentle pulse while waiting
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start()
    })

    // 3. Redirect after 2 seconds
    const timer = setTimeout(() => router.replace('/(tabs)'), 2000)
    return () => clearTimeout(timer)
  }, [])

  const iconScale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] })

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
          <Ionicons name="checkmark-circle" size={90} color="#16a34a" />
        </Animated.View>

        <Text style={styles.heading}>Order Placed!</Text>
        <Text style={styles.sub}>Your order has been placed successfully.{'\n'}We'll get it to you soon.</Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <PulseDot key={i} delay={i * 200} />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

function PulseDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1,   duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return <Animated.View style={[styles.dot, { opacity: anim }]} />
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#14532d',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: '#4b7a5a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
})
