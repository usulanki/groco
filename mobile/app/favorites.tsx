import { useEffect, useState } from 'react'
import {
  View, Text, Image, FlatList,
  StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { productsApi, mediaUrl } from '@/lib/api'
import type { Product } from '@/lib/api'
import { useFavorites } from '@/context/favorites'
import { useCart } from '@/context/cart'
import ViewCartBar from '@/components/ViewCartBar'
import ProductPlaceholder from '@/components/ProductPlaceholder'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_GAP = 10
const CARD_W   = (SCREEN_W - 16 * 2 - CARD_GAP) / 2

export default function FavoritesScreen() {
  const router        = useRouter()
  const insets        = useSafeAreaInsets()
  const { ids, toggle, isFav } = useFavorites()
  const { items, addItem, updateQty } = useCart()

  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (ids.size === 0) { setProducts([]); return }
    setLoading(true)
    Promise.all([...ids].map(id => productsApi.getById(id)))
      .then(results => setProducts(results as unknown as Product[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ids])

  const renderItem = ({ item }: { item: Product }) => {
    const imageUri  = item.images?.[0]?.path ? mediaUrl(item.images[0].path) : null
    const price     = item.prices?.[0]?.price
    const origPrice = item.prices?.[0]?.original_price as number | null | undefined
    const hasDisc   = origPrice != null && price != null && origPrice > price
    const discPct   = hasDisc ? Math.round((1 - price! / origPrice!) * 100) : 0

    const cartId   = `${item.id}_base`
    const cartItem = items.find(i => i.id === cartId)
    const qty      = cartItem?.qty ?? 0

    const handleAdd = () => addItem({
      id: cartId, productId: item.id, variantId: null,
      name: item.name, image: item.images?.[0]?.path ?? null,
      price: price ?? 0, uom: null,
    })

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}` as any)}
        style={[styles.card, { width: CARD_W }]}
      >
        <View style={styles.cardImgArea}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.cardImg} resizeMode="contain" />
          ) : (
            <ProductPlaceholder />
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            onPress={() => toggle(item.id)}
          >
            <Ionicons name={isFav(item.id) ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
          </TouchableOpacity>
          {hasDisc && (
            <View style={styles.discBadge}>
              <Text style={styles.discBadgeText}>{discPct}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.addRow}>
          <View style={{ flex: 1 }} />
          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAdd}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(cartId, qty - 1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(cartId, qty + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price ?? '—'}</Text>
            {hasDisc && <Text style={styles.origPrice}>₹{origPrice}</Text>}
          </View>
          {hasDisc && <Text style={styles.discText}>{discPct}% OFF on MRP</Text>}
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffcc01" />
        </View>
      ) : ids.size === 0 || products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={56} color="#e5e7eb" />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySub}>Tap the heart on any product to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: CARD_GAP, marginBottom: CARD_GAP }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}

      <View style={styles.cartBarWrap}>
        <ViewCartBar />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f0f0f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#eeeeee',
  },
  headerBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },

  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginTop: 16, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  grid: { padding: 16, paddingBottom: 90 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#eeeeee',
  },
  cardImgArea: {
    width: '100%', aspectRatio: 0.9,
    backgroundColor: '#ffffff', position: 'relative',
  },
  cardImg:         { width: '100%', height: '100%' },
  cardImgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#e0f2fe', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  discBadgeText: { fontSize: 9, fontWeight: '700', color: '#0369a1' },
  divider:       { height: 1, backgroundColor: '#f0f0f0' },
  addRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  addBtn:     { borderWidth: 1.5, borderColor: '#ffcc01', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 4 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ffcc01', borderRadius: 6, overflow: 'hidden',
  },
  qtyBtn:     { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffcc01' },
  qtyBtnText: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  qtyCount:   { minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  cardInfo:   { paddingHorizontal: 8, paddingBottom: 10 },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 },
  price:      { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  origPrice:  { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  discText:   { fontSize: 11, fontWeight: '600', color: '#16a34a', marginBottom: 3 },
  productName:{ fontSize: 12, color: '#374151', lineHeight: 17 },

  cartBarWrap: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
})
