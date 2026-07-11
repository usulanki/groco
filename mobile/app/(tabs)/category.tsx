import { View, Text, StyleSheet } from 'react-native'

export default function CategoryScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>🗂️</Text>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.sub}>Browse by category</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  icon:   { fontSize: 48, marginBottom: 12 },
  title:  { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  sub:    { fontSize: 13, color: '#6b7280' },
})
