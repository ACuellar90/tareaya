import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { COLORS } from '../constants/colors'
import db from '../database/db'

export default function HomeScreen({ navigation }) {
  const [hijos, setHijos] = useState([])
  const [tareasHoy, setTareasHoy] = useState([])
  const [tareasUrgentes, setTareasUrgentes] = useState([])
  const [totalPendientes, setTotalPendientes] = useState(0)

  useFocusEffect(
    useCallback(() => {
      cargarDatos()
    }, [])
  )

  const cargarDatos = () => {
    const hijosData = db.getAllSync('SELECT * FROM hijos ORDER BY nombre ASC')
    setHijos(hijosData)

    const hoy = new Date().toISOString().split('T')[0]

    const hoyData = db.getAllSync(
      `SELECT t.*, h.nombre as hijo_nombre, h.color as hijo_color,
       m.nombre as materia_nombre
       FROM tareas t
       JOIN hijos h ON t.hijo_id = h.id
       LEFT JOIN materias m ON t.materia_id = m.id
       WHERE t.fecha_entrega = ? AND t.estado != 'entregada'
       ORDER BY t.prioridad ASC`,
      [hoy]
    )
    setTareasHoy(hoyData)

    const urgentesData = db.getAllSync(
      `SELECT t.*, h.nombre as hijo_nombre, h.color as hijo_color,
       m.nombre as materia_nombre
       FROM tareas t
       JOIN hijos h ON t.hijo_id = h.id
       LEFT JOIN materias m ON t.materia_id = m.id
       WHERE t.fecha_entrega BETWEEN ? AND date(?, '+3 days')
       AND t.estado != 'entregada'
       ORDER BY t.fecha_entrega ASC`,
      [hoy, hoy]
    )
    setTareasUrgentes(urgentesData)

    const pendientes = db.getFirstSync(
      `SELECT COUNT(*) as total FROM tareas
       WHERE estado = 'pendiente' OR estado = 'en_progreso'`
    )
    setTotalPendientes(pendientes?.total || 0)
  }

  const getSaludo = () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getFecha = () => {
    return new Date().toLocaleDateString('es-SV', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
  }

  const getPrioridadColor = (prioridad) => {
    if (prioridad === 'alta') return '#E24B4A'
    if (prioridad === 'media') return '#BA7517'
    return '#1D9E75'
  }

  const getEstadoInfo = (estado) => {
    if (estado === 'entregada') return { color: '#1D9E75', bg: '#E1F5EE', label: 'Entregada' }
    if (estado === 'en_progreso') return { color: '#185FA5', bg: '#E6F1FB', label: 'En progreso' }
    if (estado === 'vencida') return { color: '#E24B4A', bg: '#FCEBEB', label: 'Vencida' }
    return { color: '#BA7517', bg: '#FAEEDA', label: 'Pendiente' }
  }

  const renderTareaCard = (t, index) => {
    const estadoInfo = getEstadoInfo ? getEstadoInfo(t.estado) : { color: '#BA7517', bg: '#FAEEDA', label: 'Pendiente' }
    const hijo = hijos.find(h => h.id === t.hijo_id)
    return (
      <TouchableOpacity
        key={index}
        style={[styles.tareaCard, { borderLeftColor: t.hijo_color, borderLeftWidth: 5 }]}
        onPress={() => hijo && navigation.navigate('DetalleTarea', { tarea: t, hijo })}
      >
        <View style={styles.tareaCardTop}>
          <View style={[styles.hijoBadge, { backgroundColor: t.hijo_color + '22' }]}>
            <View style={[styles.hijoAvatar, { backgroundColor: t.hijo_color }]}>
              <Text style={styles.hijoAvatarText}>{t.hijo_nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.hijoText, { color: t.hijo_color }]}>{t.hijo_nombre}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: t.estado === 'entregada' ? '#E1F5EE' : '#FAEEDA' }]}>
            <Text style={[styles.estadoText, { color: t.estado === 'entregada' ? '#1D9E75' : '#BA7517' }]}>
              {t.estado}
            </Text>
          </View>
        </View>
        <Text style={styles.tareaTitulo}>{t.titulo}</Text>
        <View style={styles.tareaCardBottom}>
          {t.materia_nombre && (
            <Text style={styles.materiaText}>📚 {t.materia_nombre}</Text>
          )}
          {t.fecha_entrega && (
            <Text style={styles.fechaText}>📅 {t.fecha_entrega}</Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>{getSaludo()}</Text>
          <Text style={styles.fecha}>{getFecha()}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('Hijos')}
        >
          <Ionicons name="people" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{hijos.length}</Text>
          <Text style={styles.statLabel}>Hijos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#BA7517' }]}>{totalPendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#E24B4A' }]}>{tareasHoy.length}</Text>
          <Text style={styles.statLabel}>Para hoy</Text>
        </View>
      </View>

      {hijos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>¡Bienvenido a TareaKids!</Text>
          <Text style={styles.emptyDesc}>Empezá agregando a tus hijos para organizar sus tareas</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('Hijos')}
          >
            <Text style={styles.emptyBtnText}>Agregar primer hijo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {tareasHoy.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: '#E24B4A' }]} />
                  <Text style={styles.sectionTitle}>Para entregar hoy</Text>
                </View>
                <Text style={styles.sectionCount}>{tareasHoy.length}</Text>
              </View>
              <View style={styles.tareasGrid}>
                {tareasHoy.map((t, i) => renderTareaCard(t, i))}
              </View>
            </View>
          )}

          {tareasUrgentes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: '#BA7517' }]} />
                  <Text style={styles.sectionTitle}>Próximos 3 días</Text>
                </View>
                <Text style={styles.sectionCount}>{tareasUrgentes.length}</Text>
              </View>
              <View style={styles.tareasGrid}>
                {tareasUrgentes.map((t, i) => renderTareaCard(t, i))}
              </View>
            </View>
          )}

          {tareasHoy.length === 0 && tareasUrgentes.length === 0 && (
            <View style={styles.todoListo}>
              <Text style={styles.todoListoIcon}>🎉</Text>
              <Text style={styles.todoListoTitle}>¡Todo al día!</Text>
              <Text style={styles.todoListoDesc}>No hay tareas urgentes por ahora</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.sectionTitle}>Mis hijos</Text>
              </View>
            </View>
            {hijos.map(h => {
              const tareasHijo = db.getFirstSync(
                `SELECT COUNT(*) as total FROM tareas
                 WHERE hijo_id = ? AND (estado = 'pendiente' OR estado = 'en_progreso')`,
                [h.id]
              )
              return (
                <TouchableOpacity
                  key={h.id}
                  style={styles.hijoCard}
                  onPress={() => navigation.navigate('PerfilHijo', { hijo: h })}
                >
                  <View style={[styles.hijoAvatar, { backgroundColor: h.color }]}>
                    <Text style={styles.hijoAvatarText}>{h.nombre.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.hijoInfo}>
                    <Text style={styles.hijoNombre}>{h.nombre}</Text>
                    <Text style={styles.hijoGrado}>{h.grado}</Text>
                  </View>
                  {tareasHijo?.total > 0 && (
                    <View style={[styles.pendienteBadge, { backgroundColor: h.color }]}>
                      <Text style={styles.pendienteBadgeText}>{tareasHijo.total}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )
            })}
          </View>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  saludo: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  fecha: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center'
  },
  statsRow: { flexDirection: 'row', gap: 12, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border
  },
  statNum: { fontSize: 24, fontWeight: '500', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 20, marginTop: 8
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  sectionCount: {
    fontSize: 12, color: COLORS.textSecondary,
    backgroundColor: COLORS.background, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10
  },
  tareasGrid: {
    flexDirection: 'column',
    gap: 10,
    padding: 12,
  },
  tareaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    width: '100%',
  },
  tareaCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  hijoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20,
  },
  hijoAvatar: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  hijoAvatarText: { fontSize: 10, fontWeight: '500', color: '#fff' },
  hijoText: { fontSize: 11, fontWeight: '500' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  estadoText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  tareaTitulo: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 18 },
  tareaCardBottom: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  materiaText: { fontSize: 11, color: COLORS.textSecondary },
  fechaText: { fontSize: 11, color: COLORS.textSecondary },
  todoListo: { alignItems: 'center', padding: 40, gap: 8 },
  todoListoIcon: { fontSize: 48 },
  todoListoTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  todoListoDesc: { fontSize: 14, color: COLORS.textSecondary },
  hijoCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 8
  },
  hijoAvatarGrande: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center'
  },
  hijoAvatarGrandeText: { fontSize: 18, fontWeight: '500', color: '#fff' },
  hijoInfo: { flex: 1 },
  hijoNombre: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  hijoGrado: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  pendienteBadge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  pendienteBadgeText: { fontSize: 12, fontWeight: '500', color: '#fff' },
})