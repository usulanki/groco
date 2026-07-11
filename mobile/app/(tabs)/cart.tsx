import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCart, type CartItem } from '@/context/cart'
import { mediaUrl } from '@/lib/api'

function CartItemRow({ item, onDec, onInc, onRemove }: {
  item:     CartItem
  onDec:    () => void
  onInc:    () => void
  onRemove: () => void
}) {
  return (
    <View style={styles.row}>
      <View style={styles.imgWrap}>
        {item.image ? (
          <Image source={{ uri: mediaUrl(item.image) }} style={styles.img} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 28 }}>📦</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        {item.uom && <Text style={styles.itemUom}>{item.uom}</Text>}
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      <View style={styles.qtyBlock}>
        <TouchableOpacity style={styles.qtyBtn} activeOpacity={0.7} onPress={onDec}>
          <Ionicons name={item.qty === 1 ? 'trash-outline' : 'remove'} size={16} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.qtyNum}>{item.qty}</Text>
        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} activeOpacity={0.7} onPress={onInc}>
          <Ionicons name="add" size={16} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function CartScreen() {
  const { items, updateQty, removeItem, totalItems, totalPrice } = useCart()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add products to get started</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        style={{ backgroundColor: '#f9fafb' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onDec={() => updateQty(item.id, item.qty - 1)}
            onInc={() => updateQty(item.id, item.qty + 1)}
            onRemove={() => removeItem(item.id)}
          />
        )}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.85} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#1a1a1a" />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, backgroundColor: '#ffffff' },
  emptyBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon:  { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  emptySub:   { fontSize: 13, color: '#6b7280' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  headerCount: { fontSize: 13, color: '#6b7280', marginRight: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  imgWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: 64, height: 64 },
  info: { flex: 1, gap: 3 },
  itemName:  { fontSize: 13, fontWeight: '600', color: '#1a1a1a', lineHeight: 18 },
  itemUom:   { fontSize: 11, color: '#9ca3af' },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },

  qtyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: '#ffcc01',
  },
  qtyNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: 22,
    textAlign: 'center',
  },

  sep: { height: 8 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  checkoutBtn: {
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  checkoutText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
})
