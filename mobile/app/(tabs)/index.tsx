import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View, Text, ScrollView, Image, FlatList,
  StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, StatusBar, RefreshControl, Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useCms } from '@/context/cms'
import { useAuth } from '@/context/auth'
import { useCart } from '@/context/cart'
import { useAddress } from '@/context/address'
import ViewCartBar from '@/components/ViewCartBar'
import ActiveOrderBar, { type ActiveOrder } from '@/components/ActiveOrderBar'
import ProductPlaceholder from '@/components/ProductPlaceholder'
import LocationModal from '@/components/LocationModal'
import { categoriesApi, productsApi, ordersApi, mediaUrl, type PlacedOrder } from '@/lib/api'
import { orderEvents } from '@/lib/orderEvents'
import { useOutlet } from '@/context/outlet'
import type {
  HomeComponent, AppSliderConfig, AppCategoryConfig, AppProductConfig,
  Category, Product,
} from '@/lib/api'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity / 100})`
}

function iconBorderRadius(config: AppCategoryConfig): number | string {
  if (config.icon_shape === 'circle')  return config.icon_size / 2
  if (config.icon_shape === 'rounded') return config.icon_radius
  if (config.icon_shape === 'square')  return 4
  return 0
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function SliderSection({ config }: { config: AppSliderConfig }) {
  const { images, auto_scroll, auto_scroll_interval, show_dots,
    dot_color, dot_active_color, image_radius, image_height,
    gap, side_padding, show_count } = config

  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<FlatList>(null)
  const totalRef = useRef(images.length)
  totalRef.current = images.length

  const itemW = show_count === '1.5'
    ? SCREEN_W - side_padding * 2 - gap * 0.5
    : SCREEN_W - side_padding * 2

  useEffect(() => {
    if (!auto_scroll || images.length < 2) return
    const ms = auto_scroll_interval * 1000
    const timer = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % totalRef.current
        listRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, ms)
    return () => clearInterval(timer)
  }, [auto_scroll, auto_scroll_interval, images.length])

  if (!images.length) return null

  return (
    <View>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled={show_count === '1'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: side_padding, gap }}
        snapToInterval={show_count === '1' ? itemW + gap : undefined}
        decelerationRate="fast"
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (itemW + gap))
          setActiveIdx(Math.min(idx, images.length - 1))
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            style={{
              width: itemW,
              height: image_height,
              borderRadius: image_radius,
            }}
            resizeMode="cover"
          />
        )}
        getItemLayout={(_, index) => ({
          length: itemW + gap,
          offset: (itemW + gap) * index,
          index,
        })}
      />
      {show_dots && images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIdx ? dot_active_color : dot_color },
                i === activeIdx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// ─── Categories ───────────────────────────────────────────────────────────────

function CategorySection({ config }: { config: AppCategoryConfig }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    categoriesApi.getAll()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  if (!categories.length) return null

  const iconSize    = config.icon_size
  const gridGap     = 12
  const gridItemW   = (SCREEN_W - 32 - gridGap * (config.columns - 1)) / config.columns
  const borderR    = iconBorderRadius(config)
  const bgStyle    = config.icon_shape !== 'none'
    ? {
        backgroundColor: hexToRgba(config.icon_bg_color, config.icon_bg_opacity),
        borderRadius: borderR as number,
        ...(config.icon_border_width > 0 ? {
          borderWidth: config.icon_border_width,
          borderColor: config.icon_border_color,
        } : {}),
      }
    : {}

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.catItem, { backgroundColor: config.bg_color }, config.layout === 'grid' && { width: gridItemW }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/category/${item.slug}` as any)}
    >
      <View style={[{ width: iconSize, height: iconSize, alignItems: 'center', justifyContent: 'center' }, bgStyle]}>
        {item.media?.path ? (
          <Image
            source={{ uri: mediaUrl(item.media.path) }}
            style={{ width: iconSize * 0.65, height: iconSize * 0.65, borderRadius: 4 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: iconSize * 0.4, fontWeight: '700', color: '#6b7280' }}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      {config.show_label && (
        <Text
          style={{
            fontSize: config.label_size,
            fontWeight: config.label_bold ? '700' : '400',
            color: config.label_color,
            marginTop: 4,
            textAlign: 'center',
            maxWidth: iconSize + 8,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={{ backgroundColor: config.bg_color, paddingVertical: 12 }}>
      {config.show_section_title && (
        <Text style={{
          fontSize: config.section_title_size,
          fontWeight: '700',
          color: config.section_title_color,
          paddingHorizontal: 16,
          marginBottom: 10,
        }}>
          {config.section_title}
        </Text>
      )}
      {config.layout === 'scroll' ? (
        <FlatList
          data={categories}
          keyExtractor={c => String(c.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={renderItem}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={c => String(c.id)}
          numColumns={config.columns}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          columnWrapperStyle={config.columns > 1 ? { gap: 12, marginBottom: 12 } : undefined}
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

// ─── Products ─────────────────────────────────────────────────────────────────

function ProductsSection({ config, outletIds, refreshKey, onRefreshDone }: {
  config: AppProductConfig
  outletIds: number[]
  refreshKey?: number
  onRefreshDone?: () => void
}) {
  const router     = useRouter()
  const { items, addItem, updateQty } = useCart()
  const [products,         setProducts]         = useState<Product[]>([])
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({})

  useEffect(() => {
    const params: { limit?: number; category_id?: number; outlet_ids?: number[] } = {
      limit: config.product_count,
      ...(outletIds.length ? { outlet_ids: outletIds } : {}),
    }
    if (config.source === 'category' && config.category_id) {
      params.category_id = config.category_id
    }
    productsApi.getList(params)
      .then(data => setProducts(data?.rows ?? []))
      .catch(() => {})
      .finally(() => onRefreshDone?.())
  }, [config.source, config.category_id, config.product_count, outletIds.join(','), refreshKey])

  if (!products.length) return null

  const cols       = config.columns
  const gap        = 10
  const cardWidth  = (SCREEN_W - 32 - gap * (cols - 1)) / cols
  const imgHeight  = cardWidth * 0.9
  const nameLineH  = config.name_size * 1.4
  const nameFixedH = nameLineH * 2   // always reserve 2-line height

  const rows: Product[][] = []
  for (let i = 0; i < products.length; i += cols) {
    rows.push(products.slice(i, i + cols))
  }

  return (
    <View style={{ backgroundColor: config.bg_color, paddingVertical: 12 }}>
      {config.show_heading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
          <Text style={{ fontSize: config.heading_size, fontWeight: '700', color: config.heading_color }}>
            {config.heading}
          </Text>
          {config.show_view_all && (
            <TouchableOpacity>
              <Text style={{ fontSize: 13, fontWeight: '600', color: config.view_all_color }}>
                {config.view_all_text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 16 }}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: 'row', gap, marginBottom: gap }}>
            {row.map(item => {
              const imageUri  = item.images?.[0]?.path ? mediaUrl(item.images[0].path) : null
              const variants  = item.variants ?? []
              const selVarId  = variants.length > 0 ? (selectedVariants[item.id] ?? variants[0].id) : null
              const activeVar = variants.find(v => v.id === selVarId) ?? null
              const price     = activeVar?.prices?.[0]?.price     ?? item.prices?.[0]?.price
              const origPrice = activeVar?.prices?.[0]?.compare_at_price ?? item.prices?.[0]?.compare_at_price
              const uom       = activeVar?.attributeValues?.[0]?.value ?? null
              const cartId    = activeVar ? `${item.id}_${activeVar.id}` : `${item.id}_base`
              const qty       = items.find(i => i.id === cartId)?.qty ?? 0
              const outOfStock = item.is_stockable === true && item.stock_qty === 0

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={outOfStock ? 1 : 0.8}
                  onPress={() => !outOfStock && router.push(`/product/${item.id}` as any)}
                  style={[styles.productCard, {
                    width: cardWidth,
                    backgroundColor: config.card_bg,
                    borderRadius: config.card_radius,
                  }]}
                >
                  {/* Image */}
                  <View style={{ width: cardWidth, height: imgHeight, borderRadius: config.image_radius, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <ProductPlaceholder />
                    )}
                    {config.show_discount_badge && origPrice && price && origPrice > price && !outOfStock && (
                      <View style={[styles.badge, { backgroundColor: config.discount_badge_bg }]}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: config.discount_badge_color }}>
                          {Math.round((1 - price / origPrice) * 100)}% OFF
                        </Text>
                      </View>
                    )}
                    {outOfStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ padding: 6 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: config.name_size,
                        lineHeight: nameLineH,
                        height: nameFixedH,
                        color: outOfStock ? '#9ca3af' : config.name_color,
                        fontWeight: '500',
                      }}
                    >
                      {item.name}
                    </Text>

                    {/* UOM chips */}
                    {variants.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 5 }}
                        contentContainerStyle={{ gap: 4 }}
                      >
                        {variants.map(v => {
                          const label       = v.attributeValues?.[0]?.value
                          if (!label) return null
                          const active      = selVarId === v.id
                          const varNoStock  = item.is_stockable === true && v.stock_qty === 0
                          return (
                            <TouchableOpacity
                              key={v.id}
                              activeOpacity={varNoStock ? 1 : 0.7}
                              style={[
                                styles.prodUomChip,
                                active && !varNoStock && styles.prodUomChipActive,
                                varNoStock && styles.prodUomChipDisabled,
                              ]}
                              onPress={() => !varNoStock && setSelectedVariants(prev => ({ ...prev, [item.id]: v.id }))}
                            >
                              <Text style={[
                                styles.prodUomChipText,
                                active && !varNoStock && styles.prodUomChipTextActive,
                                varNoStock && styles.prodUomChipTextDisabled,
                              ]}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </ScrollView>
                    )}

                    {/* Price + Add / qty control */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <View style={{ flexShrink: 1, marginRight: 4 }}>
                        {price != null && (
                          <Text style={{ fontSize: 13, fontWeight: '700', color: outOfStock ? '#9ca3af' : config.price_color }}>₹{price}</Text>
                        )}
                        {config.show_original_price && origPrice && price != null && origPrice > price && !outOfStock && (
                          <Text style={{ fontSize: 10, color: config.original_price_color, textDecorationLine: 'line-through' }}>
                            ₹{origPrice}
                          </Text>
                        )}
                      </View>
                      {config.show_add_to_cart && !outOfStock && (
                        qty === 0 ? (
                          <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: config.add_to_cart_bg }]}
                            activeOpacity={0.8}
                            onPress={() => addItem({
                              id:        cartId,
                              productId: item.id,
                              variantId: activeVar?.id ?? null,
                              name:      item.name,
                              image:     item.images?.[0]?.path ?? null,
                              price:     price ?? 0,
                              uom,
                            })}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: config.add_to_cart_color }}>Add</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.qtyControl, { borderColor: config.add_to_cart_bg }]}>
                            <TouchableOpacity
                              style={[styles.qtyBtn, { backgroundColor: config.add_to_cart_bg }]}
                              onPress={() => updateQty(cartId, qty - 1)}
                              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                              <Text style={[styles.qtyBtnText, { color: config.add_to_cart_color }]}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyCount}>{qty}</Text>
                            <TouchableOpacity
                              style={[styles.qtyBtn, { backgroundColor: config.add_to_cart_bg }]}
                              onPress={() => updateQty(cartId, qty + 1)}
                              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                              <Text style={[styles.qtyBtnText, { color: config.add_to_cart_color }]}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )
                      )}
                    </View>
                  </View>

                  {/* Full-card translucent overlay for out-of-stock */}
                  {outOfStock && <View style={[styles.outOfStockOverlay, { borderRadius: config.card_radius }]} />}
                </TouchableOpacity>
              )
            })}
            {/* Spacers to keep incomplete last row left-aligned */}
            {row.length < cols && Array.from({ length: cols - row.length }).map((_, i) => (
              <View key={i} style={{ width: cardWidth }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Location Permission Gate ─────────────────────────────────────────────────

function LocationGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = Location.useForegroundPermissions()

  // Still checking with the OS
  if (!permission) {
    return (
      <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ffcc01" />
      </View>
    )
  }

  if (permission.granted) {
    return <>{children}</>
  }

  return (
    <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
      <View style={styles.gateIconWrap}>
        <Ionicons name="location-outline" size={44} color="#ffcc01" />
      </View>
      <Text style={styles.gateTitle}>Location Access Required</Text>
      <Text style={styles.gateBody}>
        Groco needs your location to show nearby stores and deliver to your address.
        Please allow location access to continue.
      </Text>
      <TouchableOpacity
        style={styles.gateButton}
        activeOpacity={0.8}
        onPress={requestPermission}
      >
        <Text style={styles.gateButtonText}>Allow Location Access</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { components, loading, headerConfig } = useCms()
  const { isLoggedIn } = useAuth()
  const { serviceState, outletIds, nearbyOutlets, deviceLocation } = useOutlet()
  const { selectedAddress } = useAddress()
  const { totalItems: cartCount } = useCart()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugVisible, setDebugVisible] = useState(false)
  const [locationModalVisible, setLocationModalVisible] = useState(false)
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])

  const fetchActiveOrders = useCallback(() => {
    if (!isLoggedIn) return
    ordersApi.getAll()
      .then((orders: PlacedOrder[]) => {
        setActiveOrders(
          orders
            .filter(o => o.order_status !== 'delivered' && o.order_status !== 'cancelled')
            .map(o => ({
              id:        o.id,
              status:    o.order_status,
              itemCount: o.OrderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0,
            }))
        )
      })
      .catch(() => {})
  }, [isLoggedIn])

  // Fetch on mount and when auth state resolves
  useEffect(() => {
    if (!isLoggedIn) { setActiveOrders([]); return }
    fetchActiveOrders()
  }, [isLoggedIn, fetchActiveOrders])

  // Re-fetch when navigating back (e.g. after placing an order)
  useFocusEffect(useCallback(() => {
    fetchActiveOrders()
  }, [fetchActiveOrders]))

  // Poll every 60s while the box is visible; stops automatically when empty
  useEffect(() => {
    if (activeOrders.length === 0) return
    const id = setInterval(fetchActiveOrders, 60_000)
    return () => clearInterval(id)
  }, [activeOrders.length, fetchActiveOrders])

  // Refresh active orders when order detail page emits an update
  useEffect(() => orderEvents.on(fetchActiveOrders), [fetchActiveOrders])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey(k => k + 1)
    setDebugVisible(true)
  }, [])

  const {
    layout, bg_color, bg_opacity,
    show_location_row, delivery_label, location_name, location_icon_color,
    location_name_color,
    show_search, search_bg, search_placeholder, search_placeholder_color,
    show_bell, show_heart, show_profile, show_cart, icon_color,
  } = headerConfig

  const navBg         = hexToRgba(bg_color, bg_opacity)
  const showLocationRow = show_location_row && layout === 'full'
  const showSearch      = show_search && layout !== 'logo-only'
  const displayLocation = selectedAddress
    ? [selectedAddress.address1, selectedAddress.City?.name].filter(Boolean).join(', ')
    : deviceLocation ?? location_name

  if (serviceState === 'loading') {
    return (
      <LocationGate>
        <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#ffcc01" />
          <Text style={{ marginTop: 12, fontSize: 13, color: '#9ca3af' }}>Finding nearby stores…</Text>
        </View>
      </LocationGate>
    )
  }

  if (serviceState === 'not-serviceable') {
    return (
      <LocationGate>
        <View style={[styles.gateContainer, { paddingTop: insets.top }]}>
          <View style={styles.gateIconWrap}>
            <Ionicons name="storefront-outline" size={44} color="#ffcc01" />
          </View>
          <Text style={styles.gateTitle}>
            {deviceLocation ? `We're not in ${deviceLocation} yet` : 'Area not serviceable'}
          </Text>
          <Text style={styles.gateBody}>
            Groco hasn't reached your area yet, but we're growing fast! We'll be
            delivering to{deviceLocation ? ` ${deviceLocation}` : ' your area'} very
            soon. Stay tuned!
          </Text>
        </View>
      </LocationGate>
    )
  }

  return (
    <LocationGate>
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor={navBg} />

      {/* Fixed strip: status bar area — never scrolls */}
      <View style={{ height: insets.top, backgroundColor: navBg }} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={showSearch ? [1] : []}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ffcc01']}
            tintColor="#ffcc01"
          />
        }
      >
        {/* [0] Scrolls away: logo + icons + location row */}
        <View style={[styles.navbarScrollable, { backgroundColor: navBg }]}>
          <View style={[styles.navbarMain, layout === 'compact' && { marginTop: 8 }]}>
            <View style={styles.navbarBrand}>
              <View style={styles.navbarLogoBox}>
                <Text style={styles.navbarLogoLetter}>G</Text>
              </View>
              <Text style={styles.navbarTitle}>Groco</Text>
            </View>
            <View style={styles.navbarActions}>
              {show_bell && (
                <TouchableOpacity style={styles.navbarIconBtn} activeOpacity={0.7}>
                  <Ionicons name="notifications-outline" size={22} color={icon_color} />
                </TouchableOpacity>
              )}
              {show_heart && (
                <TouchableOpacity
                  style={styles.navbarIconBtn}
                  activeOpacity={0.7}
                  onPress={() => router.push('/favorites' as any)}
                >
                  <Ionicons name="heart-outline" size={22} color={icon_color} />
                </TouchableOpacity>
              )}
              {show_profile && (
                <TouchableOpacity
                  style={styles.navbarIconBtn}
                  activeOpacity={0.7}
                  onPress={() => router.push(isLoggedIn ? '/account' as any : '/login')}
                >
                  <Ionicons name="person-outline" size={22} color={icon_color} />
                </TouchableOpacity>
              )}
              {show_cart && (
                <TouchableOpacity
                  style={styles.navbarIconBtn}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/cart' as any)}
                >
                  <Ionicons name="cart-outline" size={22} color={icon_color} />
                  {cartCount > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          {showLocationRow && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationRow}
              onPress={() => setLocationModalVisible(true)}
            >
              <Ionicons name="location-sharp" size={16} color={location_icon_color} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={[styles.locationTitle, { color: location_name_color }]}>{delivery_label}</Text>
                <Text style={styles.locationSub} numberOfLines={1}>{displayLocation}</Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* [1] Sticks to top: search bar */}
        {showSearch && (
          <View style={[styles.stickySearch, { backgroundColor: navBg }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/search' as any)}
              style={[styles.searchWrap, { backgroundColor: search_bg }]}
            >
              <Ionicons name="search-outline" size={16} color={search_placeholder_color} style={{ marginLeft: 14 }} />
              <Text style={[styles.searchInput, { color: search_placeholder_color }]}>
                {search_placeholder}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#ffcc01" />
          </View>
        ) : !components.length ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Welcome to Groco</Text>
            <Text style={styles.emptySubtitle}>Fresh groceries, delivered fast</Text>
          </View>
        ) : (
          <>
            {components.map((comp: HomeComponent) => {
              if (comp.type === 'slider')   return <SliderSection   key={comp.id} config={comp.config} />
              if (comp.type === 'category') return <CategorySection key={comp.id} config={comp.config} />
              if (comp.type === 'products') return <ProductsSection key={comp.id} config={comp.config} outletIds={outletIds} refreshKey={refreshKey} onRefreshDone={() => setRefreshing(false)} />
              return null
            })}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Floating bars — active orders + view cart */}
      <View style={styles.cartBarWrap}>
        {activeOrders.length > 0 && <ActiveOrderBar orders={activeOrders} />}
        <ViewCartBar />
      </View>
    </View>

    {/* Debug: nearby outlets popup (pull-to-refresh) */}
    <Modal
      visible={debugVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setDebugVisible(false)}
    >
      <View style={styles.debugOverlay}>
        <View style={styles.debugSheet}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Nearby Outlets ({nearbyOutlets.length})</Text>
            <TouchableOpacity onPress={() => setDebugVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          {nearbyOutlets.length === 0 ? (
            <Text style={styles.debugEmpty}>No outlets found near your location.</Text>
          ) : (
            nearbyOutlets.map((o, i) => (
              <View key={o.id} style={[styles.debugRow, i < nearbyOutlets.length - 1 && styles.debugRowBorder]}>
                <View style={styles.debugRowLeft}>
                  <Text style={styles.debugRowName}>{o.name}</Text>
                  <Text style={styles.debugRowSub}>ID: {o.id} · Store: {o.store_id}</Text>
                </View>
                <Text style={styles.debugRowDist}>{o.distance_km.toFixed(2)} km</Text>
              </View>
            ))
          )}
          <Text style={styles.debugState}>Service state: <Text style={{ fontWeight: '700' }}>{serviceState}</Text></Text>
        </View>
      </View>
    </Modal>

    <LocationModal visible={locationModalVisible} onClose={() => setLocationModalVisible(false)} />
    </LocationGate>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Location gate ──
  gateContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  gateIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  gateBody: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  gateButton: {
    backgroundColor: '#ffcc01',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  gateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  gateRetry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textDecorationLine: 'underline',
  },

  // ── Navbar ──
  navbarScrollable: {
    // no border/shadow — it scrolls away
  },
  navbarMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  navbarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navbarLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarLogoLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  navbarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  navbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
  },
  navbarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 11,
  },
  // ── Location ──
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 18,
  },
  locationSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  // ── Search ──
  stickySearch: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  // ── Content ──
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    marginBottom: 4,
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
  catItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addBtn: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 15, fontWeight: '800' },
  qtyCount:   { minWidth: 22, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  prodUomChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  prodUomChipActive:        { borderColor: '#ffcc01', backgroundColor: '#fffbeb' },
  prodUomChipDisabled:      { borderColor: '#e5e7eb', backgroundColor: '#f9fafb', opacity: 0.5 },
  prodUomChipText:          { fontSize: 10, color: '#6b7280', fontWeight: '500' as const },
  prodUomChipTextActive:    { color: '#1a1a1a', fontWeight: '700' as const },
  prodUomChipTextDisabled:  { color: '#9ca3af', textDecorationLine: 'line-through' as const },
  outOfStockOverlay: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  outOfStockBadge: {
    position: 'absolute' as const,
    bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  outOfStockBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#ffffff' },

  // ── View cart bar ──
  cartBarWrap: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },

  // ── Debug popup ──
  debugOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  debugSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  debugEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  debugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  debugRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  debugRowLeft: { flex: 1, marginRight: 12 },
  debugRowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  debugRowSub:  { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  debugRowDist: { fontSize: 13, fontWeight: '700', color: '#ffcc01' },
  debugState: {
    marginTop: 16,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
})

