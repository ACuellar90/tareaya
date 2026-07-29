import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS } from '../constants/colors'
import db from '../database/db'
import BrandBadge from '../components/BrandBadge'

export default function SeleccionRolScreen({ onSelectRole }) {
  const crearPerfilEstudiante = () => {
    const existente = db.getFirstSync(
      'SELECT id FROM hijos WHERE nombre = ? AND grado = ?',
      ['Mi perfil', 'Estudiante']
    )

    if (!existente) {
      db.runSync(
        'INSERT INTO hijos (nombre, grado, color) VALUES (?, ?, ?)',
        ['Mi perfil', 'Estudiante', '#5B4FCF']
      )
    }
  }

  const seleccionarRol = async (rol) => {
    await AsyncStorage.setItem('usuario_rol', rol)

    if (rol === 'estudiante') {
      crearPerfilEstudiante()
    }

    onSelectRole(rol)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <BrandBadge showTagline />
        </View>

        <Text style={styles.title}>¿Cómo vas a usar TareaYa?</Text>
        <Text style={styles.subtitle}>
          Elegí el perfil que mejor te representa. Si sos estudiante, podés organizar tus materias, tareas y recordatorios como tu agenda personal.
        </Text>

        <TouchableOpacity style={styles.card} onPress={() => seleccionarRol('padre')}>
          <View style={styles.cardIcon}>
            <Ionicons name='home-outline' size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Padre de familia</Text>
            <Text style={styles.cardDesc}>Organizá tareas, recordatorios y el seguimiento de tus hijos.</Text>
          </View>
          <Ionicons name='chevron-forward' size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => seleccionarRol('estudiante')}>
          <View style={styles.cardIcon}>
            <Ionicons name='school-outline' size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Estudiante</Text>
            <Text style={styles.cardDesc}>Mantené tus tareas y recordatorios al día desde tu cuenta.</Text>
          </View>
          <Ionicons name='chevron-forward' size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 16,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
})
