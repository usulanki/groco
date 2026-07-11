import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export default function PaymentsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.center}>
        <Ionicons name="card-outline" size={52} color="#d1d5db" style={{ marginBottom: 12 }} />
        <Text style={styles.emptyTitle}>No saved payment methods</Text>
        <Text style={styles.emptySub}>Payment methods saved during checkout will appear here</Text>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 6, textAlign: 'center',
  },
  emptySub: {
    fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20,
  },
})
