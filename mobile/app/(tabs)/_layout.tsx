import { Redirect, Tabs, usePathname, useRouter } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/auth'
import { useCms } from '@/context/cms'
import { useCart } from '@/context/cart'
import type { AppFooterConfig } from '@/lib/api'

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = 'home' | 'cart' | 'orders' | 'search' | 'bar'

const TAB_ROUTES: Record<TabKey, string> = {
  home:   '/(tabs)/',
  cart:   '/(tabs)/cart',
  orders: '/(tabs)/orders',
  search: '/search',
  bar:    '/account',
}

const TAB_ICONS: Record<TabKey, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  home:   { active: 'home',    inactive: 'home-outline'    },
  cart:   { active: 'cart',    inactive: 'cart-outline'    },
  orders: { active: 'receipt', inactive: 'receipt-outline' },
  search: { active: 'search',  inactive: 'search-outline'  },
  bar:    { active: 'menu',    inactive: 'menu-outline'    },
}

function getVisibleTabs(config: AppFooterConfig): TabKey[] {
  const all: TabKey[] = ['home', 'cart', 'orders', 'search', 'bar']
  return all.filter(key => config[`show_${key}` as keyof AppFooterConfig])
}

function getLabel(key: TabKey, config: AppFooterConfig): string {
  return String(config[`${key}_label` as keyof AppFooterConfig] ?? key)
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CmsTabBar() {
  const { footerConfig } = useCms()
  const { totalItems: cartCount } = useCart()
  const router    = useRouter()
  const pathname  = usePathname()

  if (!footerConfig.show_footer) return null

  const tabs = getVisibleTabs(footerConfig)

  function isActive(key: TabKey) {
    if (key === 'home')   return pathname === '/' || pathname === '/index'
    if (key === 'bar')    return pathname.startsWith('/account')
    if (key === 'search') return pathname.startsWith('/search')
    return pathname.includes(`/${key}`)
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: footerConfig.bg_color }}>
      <View style={[
        styles.tabBar,
        {
          backgroundColor: footerConfig.bg_color,
          borderTopColor:  footerConfig.border_color,
        },
      ]}>
        {tabs.map(key => {
          const active     = isActive(key)
          const iconColor  = active ? footerConfig.active_color : footerConfig.icon_color
          const labelColor = active ? footerConfig.active_label_color : footerConfig.label_color
          const icons      = TAB_ICONS[key]
          const showBadge  = key === 'cart' && cartCount > 0

          return (
            <TouchableOpacity
              key={key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => router.push(TAB_ROUTES[key] as any)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={active ? icons.active : icons.inactive}
                  size={24}
                  color={iconColor}
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, { fontSize: footerConfig.label_size, color: labelColor }]}>
                {getLabel(key, footerConfig)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { isLoggedIn, isLoading } = useAuth()

  if (!isLoading && !isLoggedIn) return <Redirect href="/login" />

  return (
    <Tabs
      tabBar={() => <CmsTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"  />
      <Tabs.Screen name="cart"   />
      <Tabs.Screen name="orders" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:  'row',
    borderTopWidth: 1,
    paddingTop:     8,
    paddingBottom:  4,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -6,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: '#ffcc01',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      '#1a1a1a',
    lineHeight: 11,
  },
  tabLabel: {
    fontWeight: '500',
  },
})
