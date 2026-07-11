import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, Image, FlatList,
  StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCms } from '@/context/cms'
import { useCart } from '@/context/cart'
import { useFavorites } from '@/context/favorites'
import ViewCartBar from '@/components/ViewCartBar'
import ProductPlaceholder from '@/components/ProductPlaceholder'
import { productsApi, mediaUrl } from '@/lib/api'
import type { ProductDetail, ProductVariant, ProductDetailConfig, Product } from '@/lib/api'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, config }: {
  images: { id: number; path: string }[]
  config: ProductDetailConfig
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<FlatList>(null)

  const imageUris = images.map(img => mediaUrl(img.path))

  return (
    <View style={{ backgroundColor: config.image_bg }}>
      <FlatList
        ref={listRef}
        data={imageUris}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
          setActiveIdx(idx)
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_W, height: config.image_height }}
            resizeMode="contain"
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {!imageUris.length && (
        <View style={{ width: SCREEN_W, height: config.image_height }}>
          <ProductPlaceholder size={64} />
        </View>
      )}

      {config.show_image_dots && imageUris.length > 1 && (
        <View style={styles.dotsRow}>
          {imageUris.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIdx ? config.dot_active_color : config.dot_color },
                i === activeIdx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// ─── Variant Selector ─────────────────────────────────────────────────────────

function VariantSelector({ variants, selected, onSelect, config }: {
  variants:  ProductVariant[]
  selected:  number | null
  onSelect:  (id: number) => void
  config:    ProductDetailConfig
}) {
  // Group variants by attribute name
  const attrMap = new Map<string, { value: string; variantId: number }[]>()
  for (const v of variants) {
    for (const av of v.attributeValues) {
      const attrName = av.attribute.name
      if (!attrMap.has(attrName)) attrMap.set(attrName, [])
      const existing = attrMap.get(attrName)!
      if (!existing.find(x => x.variantId === v.id)) {
        existing.push({ value: av.value, variantId: v.id })
      }
    }
  }

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
      {[...attrMap.entries()].map(([attrName, options]) => (
        <View key={attrName} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: config.variant_label_color, marginBottom: 8 }}>
            {attrName}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {options.map(opt => {
              const isActive = selected === opt.variantId
              return (
                <TouchableOpacity
                  key={opt.variantId}
                  onPress={() => onSelect(opt.variantId)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: config.variant_chip_radius,
                    backgroundColor: isActive ? config.variant_chip_active_bg : config.variant_chip_bg,
                    borderWidth: 1,
                    borderColor: isActive ? config.variant_chip_active_bg : config.variant_chip_border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isActive ? config.variant_chip_active_text : config.variant_chip_text,
                  }}>
                    {opt.value}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Product Detail Screen ────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id }                   = useLocalSearchParams<{ id: string }>()
  const router                   = useRouter()
  const { productDetailConfig: config } = useCms()
  const { items, addItem, updateQty } = useCart()
  const { isFav, toggle: toggleFav } = useFavorites()

  const [product,         setProduct]         = useState<ProductDetail | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [related,         setRelated]         = useState<Product[]>([])
  const [showAllRelated,  setShowAllRelated]  = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productsApi.getById(Number(id))
      .then(data => {
        setProduct(data)
        if (data?.variants?.length) {
          setSelectedVariant(data.variants[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!product?.Category?.id) { setRelated([]); return }
    setShowAllRelated(false)
    productsApi.getList({ category_id: product.Category.id, limit: 25 })
      .then(data => {
        const rows = data?.rows ?? []
        setRelated(rows.filter(p => p.id !== product.id))
      })
      .catch(() => {})
  }, [product?.id, product?.Category?.id])

  // Pick price from selected variant or base price
  const activePrice = (() => {
    if (selectedVariant && product?.variants) {
      const v = product.variants.find(v => v.id === selectedVariant)
      if (v?.prices?.[0]) return v.prices[0]
    }
    return product?.prices?.[0] ?? null
  })()

  const hasDiscount = activePrice &&
    activePrice.compare_at_price != null &&
    activePrice.compare_at_price > activePrice.price

  const discountPct = hasDiscount
    ? Math.round((1 - activePrice!.price / activePrice!.compare_at_price!) * 100)
    : 0

  const uom = (() => {
    if (!selectedVariant || !product?.variants) return null
    const v = product.variants.find(v => v.id === selectedVariant)
    return v?.attributeValues?.[0]?.value ?? null
  })()

  const itemKey = product ? `${product.id}_${selectedVariant ?? 'base'}` : ''
  const cartQty = items.find(i => i.id === itemKey)?.qty ?? 0

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: config.bg_color }]}>
        <ActivityIndicator size="large" color="#ffcc01" />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: config.bg_color }]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>😕</Text>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>Product not found</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: config.bg_color }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: config.card_bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
          {config.show_wishlist_btn ? (
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => toggleFav(product.id)}
            >
              <Ionicons
                name={isFav(product.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav(product.id) ? '#ef4444' : config.wishlist_color}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery images={product.images ?? []} config={config} />

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: config.card_bg }]}>
          {/* Breadcrumb */}
          {config.show_breadcrumb && product.Category && (
            <Text style={{ fontSize: 12, color: config.breadcrumb_color, marginBottom: 6 }}>
              {product.Category.name}
            </Text>
          )}

          {/* Name */}
          <Text style={{ fontSize: config.name_size, fontWeight: '700', color: config.name_color, lineHeight: config.name_size * 1.4 }}>
            {product.name}
          </Text>

          {/* Rating placeholder */}
          {config.show_rating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons key={i} name={i <= 4 ? 'star' : 'star-outline'} size={14} color={config.rating_color} />
              ))}
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>4.0</Text>
            </View>
          )}

          {/* Price row */}
          {activePrice && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: config.price_color }}>
                ₹{activePrice.final_price ?? activePrice.price}
              </Text>
              {config.show_original_price && hasDiscount && (
                <Text style={{ fontSize: 14, color: config.original_price_color, textDecorationLine: 'line-through' }}>
                  ₹{activePrice.compare_at_price}
                </Text>
              )}
              {config.show_discount_badge && hasDiscount && (
                <View style={{ backgroundColor: config.discount_badge_bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: config.discount_badge_color }}>
                    {discountPct}% OFF
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Variants */}
        {config.show_variants && (product.variants?.length ?? 0) > 0 && (
          <View style={{ backgroundColor: config.card_bg, marginTop: 8, paddingVertical: 12 }}>
            <VariantSelector
              variants={product.variants!}
              selected={selectedVariant}
              onSelect={setSelectedVariant}
              config={config}
            />
          </View>
        )}

        {/* Description */}
        {config.show_description && (product.description || product.short_description) && (
          <View style={{ backgroundColor: config.card_bg, marginTop: 8, padding: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>Description</Text>
            <Text style={{ fontSize: 13, color: config.description_color, lineHeight: 20 }}>
              {product.description ?? product.short_description}
            </Text>
          </View>
        )}

        {/* Related products */}
        {config.show_related_products && related.length > 0 && (
          <View style={{ backgroundColor: config.card_bg, marginTop: 8, paddingVertical: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: config.related_heading_color, paddingHorizontal: 16, marginBottom: 12 }}>
              Related Products
            </Text>
            <View style={styles.relatedGrid}>
              {(showAllRelated ? related : related.slice(0, 12)).map(item => {
                const imageUri  = item.images?.[0]?.path ? mediaUrl(item.images[0].path) : null
                const price     = item.prices?.[0]?.price
                const origPrice = item.prices?.[0]?.original_price
                const cardW     = (SCREEN_W - 48) / 2
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/product/${item.id}` as any)}
                    style={[styles.relatedCard, { width: cardW }]}
                  >
                    <View style={[styles.relatedImgWrap, { height: cardW * 0.85 }]}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <ProductPlaceholder />
                      )}
                    </View>
                    <View style={{ padding: 8 }}>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {price != null && (
                          <Text style={{ fontSize: 13, fontWeight: '800', color: config.price_color }}>₹{price}</Text>
                        )}
                        {origPrice && origPrice > (price ?? 0) && (
                          <Text style={{ fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' }}>₹{origPrice}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
            {!showAllRelated && related.length > 12 && (
              <TouchableOpacity style={styles.showMoreBtn} activeOpacity={0.7} onPress={() => setShowAllRelated(true)}>
                <Text style={styles.showMoreText}>Show more</Text>
                <Ionicons name="chevron-down" size={14} color="#1e3a5f" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cart bar — slides in above footer when item is added */}
      <View style={styles.cartBarWrap}>
        <ViewCartBar image={product.images?.[0]?.path ?? null} />
      </View>

      {/* CTA */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: config.card_bg, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 8 }}>
        <View style={styles.ctaRow}>
          {/* Left: ticket-style price badge */}
          <View style={styles.ctaPriceBlock}>
            <View style={styles.priceBadge}>
              {uom && (
                <Text style={styles.priceBadgeUom}>{uom}</Text>
              )}
              <View style={styles.priceBadgeRow}>
                {activePrice && (
                  <Text style={[styles.priceBadgePrice, { color: config.price_color }]}>
                    ₹{activePrice.final_price ?? activePrice.price}
                  </Text>
                )}
                {hasDiscount && config.show_original_price && activePrice && (
                  <>
                    <View style={styles.priceBadgeDivider} />
                    <Text style={[styles.priceBadgeMrp, { color: config.original_price_color }]}>
                      MRP ₹{activePrice.compare_at_price}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Right: Add to Cart or counter */}
          {cartQty === 0 ? (
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: config.add_to_cart_bg, borderRadius: config.btn_radius }]}
              activeOpacity={0.8}
              onPress={() => addItem({
                id:        itemKey,
                productId: product!.id,
                variantId: selectedVariant,
                name:      product!.name,
                image:     product!.images?.[0]?.path ?? null,
                price:     activePrice?.final_price ?? activePrice?.price ?? 0,
                uom,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: config.add_to_cart_color }}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.ctaCounter, { borderRadius: config.btn_radius, backgroundColor: config.qty_btn_bg }]}>
              <TouchableOpacity
                style={[styles.ctaCounterSide, { backgroundColor: config.add_to_cart_bg, borderRadius: config.btn_radius }]}
                activeOpacity={0.8}
                onPress={() => updateQty(itemKey, cartQty - 1)}
              >
                <Text style={{ fontSize: 20, fontWeight: '600', color: config.add_to_cart_color }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: config.qty_btn_color, minWidth: 32, textAlign: 'center' }}>
                {cartQty}
              </Text>
              <TouchableOpacity
                style={[styles.ctaCounterSide, { backgroundColor: config.add_to_cart_bg, borderRadius: config.btn_radius }]}
                activeOpacity={0.8}
                onPress={() => updateQty(itemKey, cartQty + 1)}
              >
                <Text style={{ fontSize: 20, fontWeight: '600', color: config.add_to_cart_color }}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  infoCard: {
    padding: 16,
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
  },
  cartBarWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minWidth: 140,
  },
  ctaCounterSide: {
    width: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  relatedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  relatedImgWrap: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  relatedName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 17,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaPriceBlock: {
    flex: 1,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceBadgeUom: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 3,
  },
  priceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceBadgePrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  priceBadgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#cbd5e1',
  },
  priceBadgeMrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  ctaBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
})
