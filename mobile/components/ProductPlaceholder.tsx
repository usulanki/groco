import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function ProductPlaceholder({ size = 40 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="image-outline" size={size} color="#c4c4c4" />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
