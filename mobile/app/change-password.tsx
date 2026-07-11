import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '@/lib/api'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showCur,  setShowCur]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showCon,  setShowCon]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    if (!current) { Alert.alert('Validation', 'Please enter your current password'); return }
    if (next.length < 8) { Alert.alert('Validation', 'New password must be at least 8 characters'); return }
    if (next !== confirm) { Alert.alert('Validation', 'New passwords do not match'); return }

    setSaving(true)
    try {
      await authApi.changePassword({ current_password: current, new_password: next })
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const canSave = current.length > 0 && next.length >= 8 && confirm.length > 0

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
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
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 16 }}
        >
          <PasswordField
            label="Current Password"
            value={current}
            onChangeText={setCurrent}
            placeholder="Enter current password"
            show={showCur}
            onToggle={() => setShowCur(v => !v)}
          />
          <PasswordField
            label="New Password"
            value={next}
            onChangeText={setNext}
            placeholder="At least 8 characters"
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter new password"
            show={showCon}
            onToggle={() => setShowCon(v => !v)}
            error={confirm.length > 0 && next !== confirm ? "Passwords do not match" : undefined}
          />

          <TouchableOpacity
            style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#1a1a1a" />
              : <Text style={styles.saveBtnText}>Update Password</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

function PasswordField({
  label, value, onChangeText, placeholder, show, onToggle, error,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  show: boolean
  onToggle: () => void
  error?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: '#1a1a1a',
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputWrapError: { borderColor: '#ef4444' },
  input: { flex: 1, fontSize: 15, color: '#1a1a1a', padding: 0 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: '#f3f4f6' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
})
