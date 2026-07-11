import { useEffect, useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { addressApi, type UserAddress } from '@/lib/api'
import { useAuth } from '@/context/auth'
import { useAddress } from '@/context/address'

export default function LocationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const { selectedAddress, setSelectedAddress } = useAddress()
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible || !isLoggedIn) return
    setLoading(true)
    addressApi.getAll()
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible, isLoggedIn])

  function handleSelect(a: UserAddress) {
    setSelectedAddress(a)
    onClose()
  }

  function handleDelete(id: number) {
    Alert.alert('Remove address', 'Delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await addressApi.delete(id).catch(() => {})
          setAddresses(prev => prev.filter(a => a.id !== id))
          if (selectedAddress?.id === id) setSelectedAddress(null)
        },
      },
    ])
  }

  function handleAddNew() {
    onClose()
    router.push('/add-address' as any)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Deliver to</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {!isLoggedIn ? (
          <View style={styles.center}>
            <Ionicons name="person-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Login to manage addresses</Text>
          </View>
        ) : (
          <>
            {/* Add new address */}
            <TouchableOpacity style={styles.addRow} activeOpacity={0.7} onPress={handleAddNew}>
              <View style={styles.addIconWrap}>
                <Ionicons name="add" size={18} color="#ffcc01" />
              </View>
              <Text style={styles.addRowText}>Add new address</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.listDivider} />

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color="#ffcc01" />
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="location-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>No saved addresses</Text>
                <Text style={styles.emptySub}>Tap "Add new address" to get started</Text>
              </View>
            ) : (
              <FlatList
                data={addresses}
                keyExtractor={a => String(a.id)}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedAddress?.id
                  const subtitle = [item.City?.name, item.State?.name, item.pincode].filter(Boolean).join(', ')
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelect(item)}
                      style={[styles.addressRow, isSelected && styles.addressRowActive]}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.addressIconWrap}>
                        <Ionicons name="location-sharp" size={16} color={isSelected ? '#ffcc01' : '#9ca3af'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressLine1} numberOfLines={1}>{item.address1}</Text>
                        {item.address2 ? <Text style={styles.addressLine2} numberOfLines={1}>{item.address2}</Text> : null}
                        {subtitle ? <Text style={styles.addressLine2} numberOfLines={1}>{subtitle}</Text> : null}
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )
                }}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', paddingBottom: 32,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  addIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fefce8', borderWidth: 1.5, borderColor: '#ffcc01',
    alignItems: 'center', justifyContent: 'center',
  },
  addRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  listDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 20 },
  addressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  addressRowActive: { backgroundColor: '#fefce8' },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioOuterActive: { borderColor: '#ffcc01' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffcc01' },
  addressIconWrap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#f9fafb',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  addressLine1: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  addressLine2: { fontSize: 12, color: '#6b7280' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  emptySub: { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 32 },
})
