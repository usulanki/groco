import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, ScrollView, Image,
  TouchableOpacity, ActivityIndicator,
  StyleSheet, Dimensions, StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { productsApi, categoriesApi, mediaUrl } from '@/lib/api'
import type { Product, Category } from '@/lib/api'
import { useCart } from '@/context/cart'
import ViewCartBar from '@/components/ViewCartBar'
import ProductPlaceholder from '@/components/ProductPlaceholder'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_GAP = 10
const CARD_W   = (SCREEN_W - 32 - CARD_GAP) / 2

function chunkBy2<T>(arr: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2))
  return out
}

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { items, addItem, updateQty } = useCart()
  const inputRef = useRef<TextInput>(null)

  const [query,      setQuery]      = useState('')
  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(false)

  // Load all categories once for suggestions
  useEffect(() => {
    categoriesApi.getAll()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Auto-focus
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setProducts([]); return }
    const t = setTimeout(() => {
      setLoading(true)
      productsApi.getList({ search: query.trim(), limit: 30 })
        .then(data => setProducts(data?.rows ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const q = query.trim().toLowerCase()

  // Category suggestions
  const catHits = q
    ? categories.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3)
    : []

  // Product name suggestions (first few results as autocomplete)
  const prodHits = q && products.length > 0
    ? products.slice(0, Math.min(4, products.length))
    : []

  const showSuggestions = q && (catHits.length > 0 || prodHits.length > 0)

  const renderCard = useCallback((item: Product) => {
    const imageUri  = item.images?.[0]?.path ? mediaUrl(item.images[0].path) : null
    const variants  = item.variants ?? []
    const hasVars   = variants.length > 0
    const activeVar = hasVars ? variants[0] : null
    const price     = hasVars
      ? (activeVar?.prices?.[0]?.price ?? item.prices?.[0]?.price)
      : item.prices?.[0]?.price
    const origPrice = hasVars
      ? (activeVar?.prices?.[0]?.compare_at_price ?? item.prices?.[0]?.compare_at_price)
      : item.prices?.[0]?.compare_at_price
    const hasDisc   = origPrice != null && price != null && origPrice > price
    const discPct   = hasDisc ? Math.round((1 - price! / origPrice!) * 100) : 0
    const cartId    = hasVars && activeVar ? `${item.id}_${activeVar.id}` : `${item.id}_base`
    const cartEntry = items.find(i => i.id === cartId)
    const qty       = cartEntry?.qty ?? 0

    const handleAdd = () => addItem({
      id: cartId, productId: item.id,
      variantId: activeVar?.id ?? null,
      name: item.name,
      image: item.images?.[0]?.path ?? null,
      price: price ?? 0,
      uom: activeVar?.attributeValues?.[0]?.value ?? null,
    })

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}` as any)}
        style={[styles.card, { width: CARD_W }]}
      >
        <View style={styles.cardImgWrap}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={styles.cardImg} resizeMode="contain" />
            : <ProductPlaceholder />
          }
          {hasDisc && (
            <View style={styles.discBadge}>
              <Text style={styles.discBadgeText}>{discPct}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            {price != null && <Text style={styles.price}>₹{price}</Text>}
            {hasDisc && <Text style={styles.origPrice}>₹{origPrice}</Text>}
          </View>
          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAdd}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyCtrl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(cartId, qty - 1)}>
                <Text style={styles.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(cartId, qty + 1)}>
                <Text style={styles.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    )
  }, [items, addItem, updateQty, router])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={15} color="#9ca3af" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, brands..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      {!q ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={52} color="#e5e7eb" />
          <Text style={styles.emptyText}>Search for groceries, brands and more</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          {/* Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestions}>
              {catHits.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.suggRow}
                  onPress={() => router.push(`/category/${cat.slug}` as any)}
                >
                  <Ionicons name="grid-outline" size={15} color="#6b7280" style={{ marginRight: 12 }} />
                  <Text style={styles.suggText} numberOfLines={1}>{cat.name}</Text>
                  <Ionicons name="chevron-forward" size={13} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
              {prodHits.map(prod => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.suggRow}
                  onPress={() => {
                    setQuery(prod.name)
                    inputRef.current?.blur()
                  }}
                >
                  <Ionicons name="search-outline" size={15} color="#6b7280" style={{ marginRight: 12 }} />
                  <Text style={styles.suggText} numberOfLines={1}>{prod.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Results */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#ffcc01" />
            </View>
          ) : products.length > 0 ? (
            <View style={styles.grid}>
              <Text style={styles.resultCount}>{products.length} result{products.length !== 1 ? 's' : ''} for "{q}"</Text>
              {chunkBy2(products).map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map(item => renderCard(item))}
                  {row.length < 2 && <View style={{ width: CARD_W }} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noResults}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsSub}>Try a different keyword or browse categories</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.cartBarWrap}>
        <ViewCartBar />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

  suggestions: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  suggText: { fontSize: 13, color: '#374151', flex: 1 },

  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  grid: { padding: 16 },
  resultCount: {
    fontSize: 12, fontWeight: '600', color: '#6b7280',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  noResults: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  noResultsSub:   { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  cardImgWrap: {
    width: '100%', aspectRatio: 1,
    backgroundColor: '#f9fafb',
  },
  cardImg:         { width: '100%', height: '100%' },
  cardImgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#e0f2fe', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  discBadgeText: { fontSize: 9, fontWeight: '700', color: '#0369a1' },
  cardDivider:   { height: 1, backgroundColor: '#f0f0f0' },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  price:    { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  origPrice:{ fontSize: 10, color: '#9ca3af', textDecorationLine: 'line-through' },
  addBtn:   {
    borderWidth: 1.5, borderColor: '#ffcc01', borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#1a1a1a' },
  qtyCtrl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ffcc01', borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn:    { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffcc01' },
  qtyBtnTxt: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  qtyCount:  { minWidth: 22, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#1a1a1a' },

  cardInfo: { paddingHorizontal: 8, paddingBottom: 8 },
  cardName: { fontSize: 12, color: '#374151', lineHeight: 17 },

  cartBarWrap: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
})
