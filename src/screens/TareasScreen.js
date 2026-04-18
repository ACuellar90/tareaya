import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { COLORS } from '../constants/colors'
import db from '../database/db'

const FILTROS = [
  { id: 'Todas', label: 'Todas', color: COLORS.primary },
  { id: 'Pendientes', label: 'Pendientes', color: '#BA7517' },
  { id: 'Hoy', label: 'Hoy', color: '#E24B4A' },
  { id: 'Esta semana', label: 'Esta semana', color: '#185FA5' },
  { id: 'Entregadas', label: 'Entregadas', color: '#1D9E75' },
]

export default function TareasScreen({ navigation }) {
  const [tareas, setTareas] = useState([])
  const [hijos, setHijos] = useState([])
  const [filtroActivo, setFiltroActivo] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  useFocusEffect(
    useCallback(() => {
      cargarDatos()
    }, [])
  )

  const cargarDatos = () => {
    const hijosData = db.getAllSync('SELECT * FROM hijos')
    setHijos(hijosData)

    const tareasData = db.getAllSync(
      `SELECT t.*, h.nombre as hijo_nombre, h.color as hijo_color,
       m.nombre as materia_nombre, m.color as materia_color
       FROM tareas t
       JOIN hijos h ON t.hijo_id = h.id
       LEFT JOIN materias m ON t.materia_id = m.id
       ORDER BY t.fecha_entrega ASC`
    )
    setTareas(tareasData)
  }

  const getTareasFiltradas = () => {
    let filtradas = [...tareas]
    const hoy = new Date().toISOString().split('T')[0]

    const finSemana = new Date()
    finSemana.setDate(finSemana.getDate() + 7)
    const finSemanaStr = finSemana.toISOString().split('T')[0]

    if (filtroActivo === 'Pendientes') {
      filtradas = filtradas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso')
    } else if (filtroActivo === 'Hoy') {
      filtradas = filtradas.filter(t => t.fecha_entrega === hoy)
    } else if (filtroActivo === 'Esta semana') {
      filtradas = filtradas.filter(t => t.fecha_entrega >= hoy && t.fecha_entrega <= finSemanaStr)
    } else if (filtroActivo === 'Entregadas') {
      filtradas = filtradas.filter(t => t.estado === 'entregada')
    }

    if (busqueda.trim()) {
      filtradas = filtradas.filter(t =>
        t.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.hijo_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (t.materia_nombre && t.materia_nombre.toLowerCase().includes(busqueda.toLowerCase()))
      )
    }

    return filtradas
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

  const tareasFiltradas = getTareasFiltradas()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tareas</Text>
        <Text style={styles.headerCount}>{tareasFiltradas.length} tareas</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tarea, hijo o materia..."
            placeholderTextColor={COLORS.textTertiary}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtrosContent}
      >
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filtroPill,
              { borderColor: f.color },
              filtroActivo === f.id && { backgroundColor: f.color }
            ]}
            onPress={() => setFiltroActivo(f.id)}
          >
            <Text style={[
              styles.filtroPillText,
              { color: filtroActivo === f.id ? '#fff' : f.color }
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tareasFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin tareas</Text>
            <Text style={styles.emptyDesc}>
              {busqueda ? 'No hay resultados para tu búsqueda' : 'No hay tareas en este filtro'}
            </Text>
          </View>
        ) : (
          <View style={styles.lista}>
            <View style={styles.grid}>
            {tareasFiltradas.map(t => {
              const estadoInfo = getEstadoInfo(t.estado)
              const hijo = hijos.find(h => h.id === t.hijo_id)
              return (
                <TouchableOpacity
                  key={t.id}
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
                    <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                      <Text style={[styles.estadoText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
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
            })}
            </View>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  headerCount: {
    fontSize: 12, color: COLORS.textSecondary,
    backgroundColor: COLORS.background, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12
  },
  searchRow: { padding: 12, backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.background, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 0.5, borderColor: COLORS.border
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  filtrosScroll: { backgroundColor: COLORS.surface, maxHeight: 52 },
  filtrosContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filtroPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignSelf: 'flex-start',
  },
  filtroPillActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filtroPillText: { fontSize: 12, color: COLORS.textSecondary },
  filtroPillTextActivo: { color: '#fff', fontWeight: '500' },
  scroll: { flex: 1 },
  lista: { padding: 12 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  tareaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    width: '47%',
  },
  tareaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hijoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  hijoAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  hijoAvatarText: { fontSize: 11, fontWeight: '500', color: '#fff' },
  hijoText: { fontSize: 12, fontWeight: '500' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoText: { fontSize: 11, fontWeight: '500' },
  tareaTitulo: { fontSize: 17, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 24 },
  tareaCardBottom: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  materiaText: { fontSize: 12, color: COLORS.textSecondary },
  fechaText: { fontSize: 12, color: COLORS.textSecondary },
  tipoRow: {},
  tipoText: { fontSize: 11, color: COLORS.textTertiary, textTransform: 'capitalize' },
})