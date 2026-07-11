import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '@/context/cart'
import { mediaUrl } from '@/lib/api'

const SCREEN_W = Dimensions.get('window').width

interface Props {
  image?: string | null
}

export default function ViewCartBar({ image }: Props) {
  const { totalItems } = useCart()
  const router = useRouter()

  if (totalItems === 0) return null

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.85}
      onPress={() => router.push('/(tabs)/cart' as any)}
    >
      <View style={styles.iconCircle}>
        {image ? (
          <Image
            source={{ uri: mediaUrl(image) }}
            style={styles.img}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cart-outline" size={20} color="#1a1a1a" />
        )}
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>View cart</Text>
        <Text style={styles.sub}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={16} color="#1a1a1a" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bar: {
    width: SCREEN_W * 0.50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 1, 0.48)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 204, 1, 0.85)',
    borderRadius: 36,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#ffcc01',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 204, 1, 0.50)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 204, 1, 0.78)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  textBlock: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sub: {
    fontSize: 11,
    color: '#78600a',
    marginTop: 1,
  },
  arrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 204, 1, 0.95)',
    backgroundColor: 'rgba(255, 204, 1, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
