import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image, FlatList,
  StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { categoriesApi, productsApi, mediaUrl } from '@/lib/api'
import type { Category, Product } from '@/lib/api'
import { useCart } from '@/context/cart'
import { useFavorites } from '@/context/favorites'
import { useOutlet } from '@/context/outlet'
import ViewCartBar from '@/components/ViewCartBar'
import ProductPlaceholder from '@/components/ProductPlaceholder'

const SCREEN_W  = Dimensions.get('window').width
const SIDEBAR_W = Math.round(SCREEN_W * 0.20)
const CARD_GAP  = 8
const CARD_W    = (SCREEN_W - SIDEBAR_W - CARD_GAP * 3) / 2

export default function CategoryProductsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router   = useRouter()
  const insets   = useSafeAreaInsets()

  const { items, addItem, updateQty } = useCart()
  const { isFav, toggle }            = useFavorites()
  const { outletIds }                = useOutlet()

  const [category,        setCategory]        = useState<Category | null>(null)
  const [subcategories,   setSubcategories]   = useState<Category[]>([])
  const [selectedSub,     setSelectedSub]     = useState<Category | null>(null)
  const [products,        setProducts]        = useState<Product[]>([])
  const [loadingCat,      setLoadingCat]      = useState(true)
  const [loadingProds,    setLoadingProds]    = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({})

  useEffect(() => {
    if (!slug) return
    setLoadingCat(true)
    categoriesApi.getBySlug(slug)
      .then(cat => {
        setCategory(cat)
        const subs = cat.children ?? []
        setSubcategories(subs)
        // first sub selected by default; if none, load all products by parent id
        const firstSub = subs[0] ?? null
        setSelectedSub(firstSub)
        setLoadingCat(false)
        setLoadingProds(true)
        return productsApi.getList({ category_id: firstSub?.id ?? cat.id, limit: 100, outlet_ids: outletIds })
      })
      .then(data => setProducts(data?.rows ?? []))
      .catch(() => {})
      .finally(() => setLoadingProds(false))
  }, [slug])

  const selectSub = (sub: Category) => {
    if (selectedSub?.id === sub.id) return
    setSelectedSub(sub)
    setLoadingProds(true)
    productsApi.getList({ category_id: sub.id, limit: 100, outlet_ids: outletIds })
      .then(data => setProducts(data?.rows ?? []))
      .catch(() => {})
      .finally(() => setLoadingProds(false))
  }

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUri = item.images?.[0]?.path ? mediaUrl(item.images[0].path) : null

    // Variant / UOM
    const variants  = item.variants ?? []
    const selVarId  = variants.length > 0 ? (selectedVariants[item.id] ?? variants[0].id) : null
    const activeVar = variants.find(v => v.id === selVarId) ?? null
    const uom       = activeVar?.attributeValues?.[0]?.value ?? null

    const price     = activeVar?.prices?.[0]?.price     ?? item.prices?.[0]?.price
    const origPrice = activeVar?.prices?.[0]?.compare_at_price ?? item.prices?.[0]?.compare_at_price
    const hasDisc   = origPrice != null && price != null && origPrice > price
    const discPct   = hasDisc ? Math.round((1 - price! / origPrice!) * 100) : 0

    const cartId     = activeVar ? `${item.id}_${activeVar.id}` : `${item.id}_base`
    const cartItem   = items.find(i => i.id === cartId)
    const qty        = cartItem?.qty ?? 0
    const fav        = isFav(item.id)
    const outOfStock = item.is_stockable === true && item.stock_qty === 0

    const handleAdd = () => addItem({
      id:        cartId,
      productId: item.id,
      variantId: activeVar?.id ?? null,
      name:      item.name,
      image:     item.images?.[0]?.path ?? null,
      price:     price ?? 0,
      uom,
    })

    return (
      <TouchableOpacity
        activeOpacity={outOfStock ? 1 : 0.9}
        onPress={() => !outOfStock && router.push(`/product/${item.id}` as any)}
        style={[styles.card, { width: CARD_W }]}
      >
        {/* Image area */}
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
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? '#ef4444' : '#9ca3af'} />
          </TouchableOpacity>
          {hasDisc && !outOfStock && (
            <View style={styles.discBadge}>
              <Text style={styles.discBadgeText}>{discPct}% OFF</Text>
            </View>
          )}
          {outOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* ADD / qty row */}
        <View style={styles.addRow}>
          <View style={{ flex: 1 }} />
          {!outOfStock && (qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAdd}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(cartId, qty - 1)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(cartId, qty + 1)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Price + name */}
        <View style={styles.cardInfo}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, outOfStock && { color: '#9ca3af' }]}>₹{price ?? '—'}</Text>
            {hasDisc && !outOfStock && <Text style={styles.origPrice}>₹{origPrice}</Text>}
          </View>
          {hasDisc && !outOfStock && <Text style={styles.discText}>{discPct}% OFF on MRP</Text>}
          <Text style={[styles.productName, outOfStock && { color: '#9ca3af' }]} numberOfLines={2}>{item.name}</Text>

          {/* UOM chips */}
          {variants.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.uomScroll}
              contentContainerStyle={styles.uomScrollContent}
            >
              {variants.map(v => {
                const label      = v.attributeValues?.[0]?.value
                if (!label) return null
                const active     = selVarId === v.id
                const varNoStock = item.is_stockable === true && v.stock_qty === 0
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.uomChip, active && !varNoStock && styles.uomChipActive, varNoStock && styles.uomChipDisabled]}
                    activeOpacity={varNoStock ? 1 : 0.7}
                    onPress={() => !varNoStock && setSelectedVariants(prev => ({ ...prev, [item.id]: v.id }))}
                  >
                    <Text style={[styles.uomChipText, active && !varNoStock && styles.uomChipTextActive, varNoStock && styles.uomChipTextDisabled]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>

        {/* Full-card translucent overlay */}
        {outOfStock && <View style={styles.outOfStockOverlay} />}
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category?.name ?? 'Category'}
        </Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {loadingCat ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffcc01" />
        </View>
      ) : (
        <View style={styles.body}>

          {/* ── Left: subcategory vertical slider ── */}
          <ScrollView
            style={styles.sidebar}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {subcategories.map(sub => {
              const active = selectedSub?.id === sub.id
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subItem, active && styles.subItemActive]}
                  onPress={() => selectSub(sub)}
                  activeOpacity={0.75}
                >
                  <View style={styles.subCircle}>
                    {sub.media?.path ? (
                      <Image
                        source={{ uri: mediaUrl(sub.media.path) }}
                        style={styles.subCircleImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.subInitial}>
                        {sub.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.subLabel, active && styles.subLabelActive]} numberOfLines={2}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* ── Right: product grid ── */}
          <View style={styles.productsPane}>
            {loadingProds ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color="#ffcc01" />
              </View>
            ) : products.length === 0 ? (
              <View style={styles.center}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🛒</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>No products found</Text>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={p => String(p.id)}
                numColumns={2}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
                renderItem={renderProduct}
              />
            )}
          </View>
        </View>
      )}

      <View style={styles.cartBarWrap}>
        <ViewCartBar />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f0f0f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 17, fontWeight: '700', color: '#1a1a1a',
  },

  // Body
  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e8e8e8',
  },
  subItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRightWidth: 3,
    borderRightColor: 'transparent',
  },
  subItemActive: {
    borderRightColor: '#ffcc01',
  },
  subCircle: {
    width: SIDEBAR_W - 20,
    height: SIDEBAR_W - 20,
    borderRadius: (SIDEBAR_W - 20) / 2,
    backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 5,
  },
  subCircleImg: { width: '100%', height: '100%' },
  subInitial:   { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  subLabel: {
    fontSize: 10, color: '#6b7280',
    textAlign: 'center', lineHeight: 13,
  },
  subLabelActive: { color: '#1a1a1a', fontWeight: '700' },

  // Product grid
  productsPane: { width: Dimensions.get('window').width - SIDEBAR_W },
  gridContent:  { padding: CARD_GAP, paddingBottom: 90 },
  gridRow:      { gap: CARD_GAP, marginBottom: CARD_GAP, justifyContent: 'flex-start' },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  cardImgArea: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  cardImg: { width: '100%', height: '100%' },
  cardImgFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  discBadgeText: { fontSize: 9, fontWeight: '700', color: '#0369a1' },
  divider:       { height: 1, backgroundColor: '#f0f0f0' },
  addRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  addBtn: {
    borderWidth: 1.5, borderColor: '#ffcc01',
    borderRadius: 6, paddingHorizontal: 16, paddingVertical: 4,
  },
  addBtnText:  { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffcc01',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffcc01',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  qtyCount:   { minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  cardInfo:    { paddingHorizontal: 8, paddingBottom: 8 },
  uomScroll:        { marginTop: 6 },
  uomScrollContent: { gap: 4, paddingBottom: 2 },
  uomChip: {
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  uomChipActive:        { borderColor: '#ffcc01', backgroundColor: '#fffbeb' },
  uomChipDisabled:      { borderColor: '#e5e7eb', backgroundColor: '#f9fafb', opacity: 0.5 },
  uomChipText:          { fontSize: 10, color: '#6b7280', fontWeight: '500' as const },
  uomChipTextActive:    { color: '#1a1a1a', fontWeight: '700' as const },
  uomChipTextDisabled:  { color: '#9ca3af', textDecorationLine: 'line-through' as const },
  outOfStockOverlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
  },
  outOfStockBadge: {
    position: 'absolute' as const,
    bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  outOfStockBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#ffffff' },
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 },
  price:       { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  origPrice:   { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  discText:    { fontSize: 11, fontWeight: '600', color: '#16a34a', marginBottom: 3 },
  productName: { fontSize: 12, color: '#374151', lineHeight: 17 },

  cartBarWrap: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
})
