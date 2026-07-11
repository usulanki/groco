import { useState } from 'react'
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
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { authApi } from '@/lib/api'

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

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.'
  return null
}

export default function RegisterScreen() {
  const { login } = useAuth()
  const router = useRouter()

  const [fname, setFname]       = useState('')
  const [lname, setLname]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleRegister = async () => {
    if (!fname.trim() || !lname.trim()) {
      setError('Please enter your first and last name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const data = await authApi.register({
        fname: fname.trim(),
        lname: lname.trim(),
        email: email.trim(),
        password,
      })
      login(data.accessToken, data.user)
      router.replace('/(tabs)')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>Groco</Text>
            <Text style={styles.tagline}>Fresh groceries, delivered fast</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            {/* Name row */}
            <View style={styles.nameRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane"
                  placeholderTextColor={C.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={fname}
                  onChangeText={setFname}
                  editable={!loading}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor={C.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={lname}
                  onChangeText={setLname}
                  editable={!loading}
                />
              </View>
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
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  placeholderTextColor={C.textLight}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
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

            {/* Confirm password */}
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={C.textLight}
                  secureTextEntry={!showCf}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirm}
                  onChangeText={setConfirm}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowCf(p => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showCf ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign up button */}
            <TouchableOpacity
              style={[styles.signUpBtn, loading && styles.btnDisabled]}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.onBrand} />
              ) : (
                <Text style={styles.signUpBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginText}>
              {'Already have an account? '}
              <Text style={styles.loginLink}>Sign in</Text>
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

  hero: {
    backgroundColor: C.brand,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
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

  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
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

  signUpBtn: {
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  signUpBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onBrand,
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  loginText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 20,
    backgroundColor: C.card,
  },
  loginLink: {
    color: C.brandDark,
    fontWeight: '700',
  },
})
