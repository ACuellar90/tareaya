import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../constants/colors'

export default function BrandBadge({ compact = false, showTagline = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>TY</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.name}>TareaYa</Text>
        {showTagline && (
          <Text style={styles.tagline}>
            {compact ? 'Organiza tu semana' : 'Organiza tareas y recordatorios'}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textWrap: {
    flexShrink: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
})
