import { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { useCms } from '@/context/cms'

const C = {
  bg:       '#ffcc01',
  dark:     '#1a1a1a',
  tagline:  'rgba(26,26,26,0.55)',
  circle:   'rgba(255,255,255,0.18)',
}

export default function AppSplash() {
  const { isLoading: authLoading, isLoggedIn } = useAuth()
  const { loading: cmsLoading }                = useCms()
  const router = useRouter()

  const logoScale   = useRef(new Animated.Value(0.4)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const [minTimePassed, setMinTimePassed] = useState(false)

  useEffect(() => {
    SplashScreen.hideAsync()

    // Minimum 1.5 s of splash visibility (runs in parallel with CMS + auth)
    const minTimer = setTimeout(() => setMinTimePassed(true), 2000)

    // Logo springs in, then text fades in
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start()
    })

    return () => {
      clearTimeout(minTimer)
    }
  }, [])

  // Navigate only when auth + CMS done AND minimum time has passed
  useEffect(() => {
    if (authLoading || cmsLoading || !minTimePassed) return
    router.replace(isLoggedIn ? '/(tabs)' : '/login')
  }, [authLoading, cmsLoading, minTimePassed, isLoggedIn])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Decorative background circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        { transform: [{ scale: logoScale }], opacity: logoOpacity },
      ]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>G</Text>
        </View>
      </Animated.View>

      {/* Brand text */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.brandName}>Groco</Text>
        <Text style={styles.tagline}>Fresh groceries, delivered fast</Text>
      </Animated.View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Decorative circles give the flat bg some depth
  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: C.circle,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.circle,
  },

  logoWrap: {
    marginBottom: 28,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logoLetter: {
    fontSize: 52,
    fontWeight: '900',
    color: C.bg,
    letterSpacing: -2,
  },

  textBlock: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: C.tagline,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

})
