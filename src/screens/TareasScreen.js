import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../constants/colors'

export default function TareasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tareas</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: COLORS.textPrimary,
  }
})