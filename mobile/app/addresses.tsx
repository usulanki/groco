import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { addressApi, type UserAddress } from '@/lib/api'
import { useAddress } from '@/context/address'

export default function AddressesScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { selectedAddress, setSelectedAddress } = useAddress()

  const [addresses,  setAddresses]  = useState<UserAddress[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAddresses = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    addressApi.getAll()
      .then(setAddresses)
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useFocusEffect(useCallback(() => { fetchAddresses() }, [fetchAddresses]))

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
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          onPress={() => router.push('/add-address' as any)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffcc01" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={52} color="#d1d5db" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySub}>Add an address to get started</Text>
          <TouchableOpacity
            style={styles.addNewBtn}
            onPress={() => router.push('/add-address' as any)}
          >
            <Text style={styles.addNewBtnText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAddresses(true)}
              colors={['#ffcc01']}
              tintColor="#ffcc01"
            />
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addRowCard}
              activeOpacity={0.7}
              onPress={() => router.push('/add-address' as any)}
            >
              <View style={styles.addIconWrap}>
                <Ionicons name="add" size={18} color="#ffcc01" />
              </View>
              <Text style={styles.addRowText}>Add new address</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const subtitle = [item.City?.name, item.State?.name, item.pincode].filter(Boolean).join(', ')
            const isSelected = selectedAddress?.id === item.id
            return (
              <View style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.cardTop}>
                  <View style={styles.locIconWrap}>
                    <Ionicons
                      name="location-sharp"
                      size={18}
                      color={isSelected ? '#ffcc01' : '#9ca3af'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addr1} numberOfLines={2}>{item.address1}</Text>
                    {item.address2 ? (
                      <Text style={styles.addr2} numberOfLines={1}>{item.address2}</Text>
                    ) : null}
                    {subtitle ? (
                      <Text style={styles.addr2} numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#ffcc01" />
                    <Text style={styles.selectedBadgeText}>Selected for delivery</Text>
                  </View>
                )}
              </View>
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
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef9c3',
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: '#1a1a1a',
  },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 6,
  },
  emptySub: {
    fontSize: 13, color: '#6b7280', marginBottom: 24,
  },
  addNewBtn: {
    backgroundColor: '#ffcc01', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  addNewBtnText: {
    fontSize: 14, fontWeight: '700', color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  cardSelected: {
    borderColor: '#ffcc01',
    backgroundColor: '#fefce8',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  addr1: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 3 },
  addr2: { fontSize: 12, color: '#6b7280', marginBottom: 1 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fef08a',
  },
  selectedBadgeText: {
    fontSize: 12, fontWeight: '600', color: '#a16207',
  },
  addRowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 14,
    padding: 14, marginTop: 4,
    borderWidth: 1.5, borderColor: '#f3f4f6', borderStyle: 'dashed',
  },
  addIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fefce8', borderWidth: 1.5, borderColor: '#ffcc01',
    alignItems: 'center', justifyContent: 'center',
  },
  addRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
})
