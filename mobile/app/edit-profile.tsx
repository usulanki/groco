import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/auth'
import { authApi } from '@/lib/api'

export default function EditProfileScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()

  const [fname,   setFname]   = useState(user?.fname ?? '')
  const [lname,   setLname]   = useState(user?.lname ?? '')
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [phone,   setPhone]   = useState(user?.phone ?? '')
  const [saving,  setSaving]  = useState(false)

  const isDirty =
    fname.trim() !== (user?.fname ?? '') ||
    lname.trim() !== (user?.lname ?? '') ||
    email.trim() !== (user?.email ?? '') ||
    phone.trim() !== (user?.phone ?? '')

  async function handleSave() {
    if (!fname.trim()) { Alert.alert('Validation', 'First name is required'); return }
    if (!lname.trim()) { Alert.alert('Validation', 'Last name is required'); return }
    if (!email.trim()) { Alert.alert('Validation', 'Email is required'); return }

    setSaving(true)
    try {
      await authApi.updateProfile({
        fname: fname.trim(),
        lname: lname.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      })
      await refreshUser()
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !isDirty}
            style={[styles.saveBtn, (!isDirty || saving) && styles.saveBtnDisabled]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#1a1a1a" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 16 }}
        >
          <Field label="First Name" value={fname} onChangeText={setFname} placeholder="First name" />
          <Field label="Last Name"  value={lname} onChangeText={setLname} placeholder="Last name" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.saveBlock, (!isDirty || saving) && styles.saveBlockDisabled]}
            onPress={handleSave}
            disabled={saving || !isDirty}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#1a1a1a" />
              : <Text style={styles.saveBlockText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType']
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize']
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        style={styles.fieldInput}
      />
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
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#ffcc01', borderRadius: 10,
    minWidth: 60, alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#f3f4f6',
  },
  saveBtnText: {
    fontSize: 14, fontWeight: '700', color: '#1a1a1a',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: '#6b7280',
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  saveBlock: {
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBlockDisabled: {
    backgroundColor: '#f3f4f6',
  },
  saveBlockText: {
    fontSize: 16, fontWeight: '700', color: '#1a1a1a',
  },
})
