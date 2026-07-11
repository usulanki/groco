import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { authApi } from '@/lib/api'

WebBrowser.maybeCompleteAuthSession()

const C = {
  brand: '#ffcc01',
  brandDark: '#e6b800',
  onBrand: '#1a1a1a',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  red: '#ef4444',
  redBg: '#fef2f2',
}

function EyeOpenIcon() {
  return <Text style={{ fontSize: 16, color: C.textMuted }}>◉</Text>
}
function EyeClosedIcon() {
  return <Text style={{ fontSize: 16, color: C.textLight }}>◎</Text>
}

export default function LoginScreen() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]           = useState('')

  // ── Google OAuth ──────────────────────────────────────────
  const googleAvailable =
    Platform.OS === 'ios'
      ? !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     || 'placeholder',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'placeholder',
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  })

  useEffect(() => {
    if (response?.type !== 'success') return
    const accessToken = response.authentication?.accessToken
    if (accessToken) handleGoogleToken(accessToken)
  }, [response])

  const handleGoogleToken = async (access_token: string) => {
    setError('')
    setGoogleLoading(true)
    try {
      const data = await authApi.googleLogin({ access_token })
      login(data.accessToken, data.user)
      router.replace('/(tabs)')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // ── Email / password login ────────────────────────────────
  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login({ email: email.trim(), password })
      login(data.accessToken, data.user)
      router.replace('/(tabs)')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.brand} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>Groco</Text>
            <Text style={styles.tagline}>Fresh groceries, delivered fast</Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue</Text>

            {/* Google button */}
            <TouchableOpacity
              style={[styles.googleBtn, (busy || !googleAvailable) && styles.btnDisabled]}
              activeOpacity={0.8}
              disabled={busy || !googleAvailable}
              onPress={() => {
                setError('')
                promptAsync()
              }}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <Text style={styles.googleG}>G</Text>
              )}
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            {!googleAvailable && (
              <Text style={styles.googleNote}>
                Add EXPO_PUBLIC_GOOGLE_{Platform.OS.toUpperCase()}_CLIENT_ID to .env to enable
              </Text>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={C.textLight}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  editable={!busy}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPw(p => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow} onPress={() => router.replace('/forgot-password')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.signInBtn, busy && styles.btnDisabled]}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={busy}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.onBrand} />
              ) : (
                <Text style={styles.signInBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity onPress={() => router.replace('/register')}>
            <Text style={styles.registerText}>
              {"Don't have an account? "}
              <Text style={styles.registerLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.brand,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    backgroundColor: C.brand,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '900',
    color: C.brand,
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: C.onBrand,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: C.onBrand,
    opacity: 0.6,
    fontWeight: '500',
  },

  // ── Card ──────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    minHeight: 520,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 24,
  },

  // ── Google button ─────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
    backgroundColor: C.card,
  },
  googleG: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  googleNote: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
    marginTop: -14,
    marginBottom: 10,
  },

  // ── Divider ───────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerLabel: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: '500',
  },

  // ── Fields ────────────────────────────────────────────────
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // ── Forgot password ───────────────────────────────────────
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.brandDark,
  },

  // ── Error ─────────────────────────────────────────────────
  errorBox: {
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: C.red,
  },

  // ── Sign in button ────────────────────────────────────────
  signInBtn: {
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onBrand,
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // ── Register link ─────────────────────────────────────────
  registerText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 20,
    backgroundColor: C.card,
  },
  registerLink: {
    color: C.brandDark,
    fontWeight: '700',
  },
})
