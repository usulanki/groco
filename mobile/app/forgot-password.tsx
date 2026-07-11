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
  green: '#16a34a',
  greenBg: '#f0fdf4',
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

export default function ForgotPasswordScreen() {
  const router = useRouter()

  // Step 1: email; Step 2: otp + new password
  const [step, setStep]         = useState<1 | 2>(1)
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email: email.trim() })
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit code from your email.'); return }
    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword({ email: email.trim(), otp, password })
      router.replace('/login')
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

          {/* Card */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a 6-digit reset code.
                </Text>

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

                {!!error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={C.onBrand} />
                    : <Text style={styles.btnText}>Send Reset Code</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Enter reset code</Text>
                <View style={styles.sentBox}>
                  <Text style={styles.sentText}>
                    A 6-digit code was sent to{' '}
                    <Text style={styles.sentEmail}>{email}</Text>
                  </Text>
                </View>

                {/* OTP */}
                <View style={styles.field}>
                  <Text style={styles.label}>Reset code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={C.textLight}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    editable={!loading}
                  />
                </View>

                {/* New password */}
                <View style={styles.field}>
                  <Text style={styles.label}>New password</Text>
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
                  <Text style={styles.label}>Confirm new password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Re-enter your new password"
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

                {!!error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={C.onBrand} />
                    : <Text style={styles.btnText}>Reset Password</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendRow}
                  onPress={() => { setStep(1); setOtp(''); setError('') }}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Didn't receive it? Try a different email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Back to login */}
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.backText}>
              {'← '}
              <Text style={styles.backLink}>Back to Sign In</Text>
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
    minHeight: 420,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },

  sentBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  sentText: {
    fontSize: 13,
    color: '#92400e',
  },
  sentEmail: {
    fontWeight: '700',
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
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
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

  btn: {
    backgroundColor: C.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onBrand,
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  resendRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 13,
    color: C.brandDark,
    fontWeight: '600',
  },

  backText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 20,
    backgroundColor: C.card,
  },
  backLink: {
    color: C.brandDark,
    fontWeight: '700',
  },
})
