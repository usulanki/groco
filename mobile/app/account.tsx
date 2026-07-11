import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/auth'

type IconName = React.ComponentProps<typeof Ionicons>['name']

interface MenuItem {
  icon:   IconName
  label:  string
  sub?:   string
  route?: string
  onPress?: () => void
  danger?: boolean
}

export default function AccountScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, logout, isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    router.replace('/login')
    return null
  }

  const initials = [user?.fname, user?.lname]
    .filter(Boolean)
    .map(n => n![0].toUpperCase())
    .join('')

  const fullName = [user?.fname, user?.lname].filter(Boolean).join(' ')

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/(tabs)')
        },
      },
    ])
  }

  const sections: { title?: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon:  'location-outline',
          label: 'My Addresses',
          sub:   'Manage delivery addresses',
          route: '/addresses',
        },
        {
          icon:  'bag-outline',
          label: 'My Orders',
          sub:   'View order history',
          route: '/(tabs)/orders',
        },
        {
          icon:  'heart-outline',
          label: 'Favourites',
          sub:   'Your saved items',
          route: '/favorites',
        },
        {
          icon:  'card-outline',
          label: 'Payment Methods',
          sub:   'Saved cards & UPI',
          route: '/payments',
        },
        {
          icon:  'lock-closed-outline',
          label: 'Change Password',
          sub:   'Update your account password',
          route: '/change-password',
        },
      ],
    },
    {
      items: [
        {
          icon:    'log-out-outline',
          label:   'Log Out',
          danger:  true,
          onPress: handleLogout,
        },
      ],
    },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => router.push('/edit-profile' as any)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName || 'User'}</Text>
            {user?.email && (
              <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
            )}
            {user?.phone && (
              <Text style={styles.email} numberOfLines={1}>{user.phone}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>

        {/* Menu sections */}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.card}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[
                    styles.row,
                    ii < section.items.length - 1 && styles.rowBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress ?? (() => item.route && router.push(item.route as any))}
                >
                  <View style={[styles.iconWrap, item.danger && styles.iconWrapDanger]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.danger ? '#ef4444' : '#374151'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
                      {item.label}
                    </Text>
                    {item.sub && (
                      <Text style={styles.rowSub}>{item.sub}</Text>
                    )}
                  </View>
                  {!item.danger && (
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
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
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapDanger: {
    backgroundColor: '#fef2f2',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowLabelDanger: {
    color: '#ef4444',
  },
  rowSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
})
