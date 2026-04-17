import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import db from '../database/db'

const ESTADOS = [
  { id: 'pendiente', label: 'Pendiente', color: '#BA7517', bg: '#FAEEDA' },
  { id: 'en_progreso', label: 'En progreso', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'entregada', label: 'Entregada', color: '#1D9E75', bg: '#E1F5EE' },
  { id: 'vencida', label: 'Vencida', color: '#E24B4A', bg: '#FCEBEB' },
]

const TIPO_ICONS = {
  tarea: 'document-text',
  examen: 'school',
  proyecto: 'construct',
  medicamento: 'medical',
  cita: 'calendar',
}

export default function DetalleTareaScreen({ route, navigation }) {
  const { tarea, hijo } = route.params
  const [estadoActual, setEstadoActual] = useState(tarea.estado)
  const [recordatorios, setRecordatorios] = useState([])
  const [materiaInfo, setMateriaInfo] = useState(null)

  useEffect(() => {
    cargarRecordatorios()
    cargarMateria()
  }, [])

  const cargarRecordatorios = () => {
    const resultado = db.getAllSync(
      'SELECT * FROM recordatorios WHERE tarea_id = ? ORDER BY fecha_hora ASC',
      [tarea.id]
    )
    setRecordatorios(resultado)
  }

  const cargarMateria = () => {
    if (tarea.materia_id) {
      const resultado = db.getFirstSync(
        'SELECT * FROM materias WHERE id = ?',
        [tarea.materia_id]
      )
      setMateriaInfo(resultado)
    }
  }

  const cambiarEstado = (nuevoEstado) => {
    db.runSync(
      'UPDATE tareas SET estado = ? WHERE id = ?',
      [nuevoEstado, tarea.id]
    )
    setEstadoActual(nuevoEstado)
  }

  const eliminarTarea = () => {
    Alert.alert('Eliminar tarea', `¿Eliminar "${tarea.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM recordatorios WHERE tarea_id = ?', [tarea.id])
          db.runSync('DELETE FROM tareas WHERE id = ?', [tarea.id])
          navigation.goBack()
        }
      }
    ])
  }

  const estadoInfo = ESTADOS.find(e => e.id === estadoActual) || ESTADOS[0]

  const getPrioridadColor = () => {
    if (tarea.prioridad === 'alta') return '#E24B4A'
    if (tarea.prioridad === 'media') return '#BA7517'
    return '#1D9E75'
  }

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha'
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-SV', {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric'
    })
  }

  const formatFechaHora = (fechaStr) => {
    if (!fechaStr) return ''
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-SV', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const diasRestantes = () => {
    if (!tarea.fecha_entrega) return null
    const hoy = new Date()
    const entrega = new Date(tarea.fecha_entrega)
    const diff = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { texto: `Venció hace ${Math.abs(diff)} días`, color: '#E24B4A' }
    if (diff === 0) return { texto: 'Vence hoy', color: '#E24B4A' }
    if (diff === 1) return { texto: 'Vence mañana', color: '#BA7517' }
    return { texto: `${diff} días restantes`, color: '#1D9E75' }
  }

  const dias = diasRestantes()

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: hijo.color }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={eliminarTarea}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBody}>
          <View style={styles.tipoRow}>
            <Ionicons
              name={TIPO_ICONS[tarea.tipo] || 'document-text'}
              size={16} color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.tipoText}>{tarea.tipo}</Text>
            {materiaInfo && (
              <View style={styles.materiaBadge}>
                <Text style={styles.materiaBadgeText}>{materiaInfo.nombre}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitulo}>{tarea.titulo}</Text>
          {tarea.descripcion ? (
            <Text style={styles.headerDesc}>{tarea.descripcion}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={20} color={hijo.color} />
            <Text style={styles.infoCardLabel}>Fecha de entrega</Text>
            <Text style={styles.infoCardValue}>{formatFecha(tarea.fecha_entrega)}</Text>
            {dias && (
              <Text style={[styles.diasRestantes, { color: dias.color }]}>{dias.texto}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoSmall}>
              <Text style={styles.infoSmallLabel}>Prioridad</Text>
              <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor() + '22' }]}>
                <View style={[styles.prioridadDot, { backgroundColor: getPrioridadColor() }]} />
                <Text style={[styles.prioridadText, { color: getPrioridadColor() }]}>
                  {tarea.prioridad}
                </Text>
              </View>
            </View>
            <View style={styles.infoSmall}>
              <Text style={styles.infoSmallLabel}>Estado actual</Text>
              <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
                  {estadoInfo.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar estado</Text>
          <View style={styles.estadosGrid}>
            {ESTADOS.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.estadoBtn,
                  { borderColor: e.color + '44' },
                  estadoActual === e.id && { backgroundColor: e.bg, borderColor: e.color }
                ]}
                onPress={() => cambiarEstado(e.id)}
              >
                {estadoActual === e.id && (
                  <Ionicons name="checkmark-circle" size={14} color={e.color} />
                )}
                <Text style={[
                  styles.estadoBtnText,
                  { color: estadoActual === e.id ? e.color : COLORS.textSecondary }
                ]}>
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recordatorios</Text>
          {recordatorios.length === 0 ? (
            <Text style={styles.sinRecordatorios}>Sin recordatorios configurados</Text>
          ) : (
            recordatorios.map((r, i) => (
              <View key={i} style={styles.recordatorioRow}>
                <Ionicons name="notifications" size={16} color={hijo.color} />
                <View style={styles.recordatorioInfo}>
                  <Text style={styles.recordatorioFecha}>{formatFechaHora(r.fecha_hora)}</Text>
                  <Text style={styles.recordatorioMensaje}>{r.mensaje}</Text>
                </View>
                <View style={[styles.repeticionBadge,
                  r.repeticion === 'diario' && { backgroundColor: COLORS.primaryLight }
                ]}>
                  <Text style={styles.repeticionText}>
                    {r.repeticion === 'diario' ? 'Diario' : 'Una vez'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  headerBody: { gap: 8 },
  tipoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipoText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },
  materiaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12
  },
  materiaBadgeText: { fontSize: 12, color: '#fff' },
  headerTitulo: { fontSize: 24, fontWeight: '500', color: '#fff' },
  headerDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  scroll: { flex: 1 },
  infoGrid: { padding: 16, gap: 12 },
  infoCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, borderWidth: 0.5, borderColor: COLORS.border, gap: 6
  },
  infoCardLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoCardValue: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  diasRestantes: { fontSize: 13, fontWeight: '500' },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoSmall: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 14, borderWidth: 0.5, borderColor: COLORS.border, gap: 8
  },
  infoSmallLabel: { fontSize: 12, color: COLORS.textSecondary },
  prioridadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start'
  },
  prioridadDot: { width: 6, height: 6, borderRadius: 3 },
  prioridadText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  estadoText: { fontSize: 13, fontWeight: '500' },
  section: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 12 },
  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  estadoBtnText: { fontSize: 13 },
  sinRecordatorios: { fontSize: 13, color: COLORS.textTertiary, fontStyle: 'italic' },
  recordatorioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, marginBottom: 8,
    backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border
  },
  recordatorioInfo: { flex: 1 },
  recordatorioFecha: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  recordatorioMensaje: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  repeticionBadge: {
    backgroundColor: COLORS.background, paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 8
  },
  repeticionText: { fontSize: 11, color: COLORS.textSecondary },
})