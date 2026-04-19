import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { COLORS } from '../constants/colors'
import db from '../database/db'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function AgendaScreen({ navigation }) {
  const [tareas, setTareas] = useState([])
  const [hijos, setHijos] = useState([])
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date())

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
       WHERE t.estado != 'entregada'
       ORDER BY t.fecha_entrega ASC`
    )
    setTareas(tareasData)
  }

  const getSemana = () => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1 + semanaOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(lunes)
      dia.setDate(lunes.getDate() + i)
      return dia
    })
  }

  const semana = getSemana()

  const getTareasDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0]
    return tareas.filter(t => t.fecha_entrega === fechaStr)
  }

  const esHoy = (fecha) => {
    const hoy = new Date()
    return fecha.toDateString() === hoy.toDateString()
  }

  const esDiaSeleccionado = (fecha) => {
    return fecha.toDateString() === diaSeleccionado.toDateString()
  }

  const tareasDiaSeleccionado = getTareasDia(diaSeleccionado)

  const getMesAno = () => {
    const meses = semana.map(d => d.getMonth())
    const mesInicio = semana[0].getMonth()
    const mesFin = semana[6].getMonth()
    if (mesInicio === mesFin) {
      return `${MESES[mesInicio]} ${semana[0].getFullYear()}`
    }
    return `${MESES[mesInicio]} / ${MESES[mesFin]} ${semana[6].getFullYear()}`
  }

  const getEstadoInfo = (estado) => {
    if (estado === 'en_progreso') return { color: '#185FA5', bg: '#E6F1FB', label: 'En progreso' }
    if (estado === 'vencida') return { color: '#E24B4A', bg: '#FCEBEB', label: 'Vencida' }
    return { color: '#BA7517', bg: '#FAEEDA', label: 'Pendiente' }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <Text style={styles.headerMes}>{getMesAno()}</Text>
      </View>

      <View style={styles.semanaContainer}>
        <TouchableOpacity onPress={() => setSemanaOffset(semanaOffset - 1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.diasRow}>
          {semana.map((dia, i) => {
            const tareasDia = getTareasDia(dia)
            const seleccionado = esDiaSeleccionado(dia)
            const hoy = esHoy(dia)
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.diaBtn,
                  seleccionado && { backgroundColor: COLORS.primary },
                  hoy && !seleccionado && { borderColor: COLORS.primary, borderWidth: 1.5 }
                ]}
                onPress={() => setDiaSeleccionado(dia)}
              >
                <Text style={[
                  styles.diaNombre,
                  seleccionado && { color: '#fff' },
                  hoy && !seleccionado && { color: COLORS.primary }
                ]}>
                  {DIAS_SEMANA[dia.getDay()]}
                </Text>
                <Text style={[
                  styles.diaNum,
                  seleccionado && { color: '#fff' },
                  hoy && !seleccionado && { color: COLORS.primary }
                ]}>
                  {dia.getDate()}
                </Text>
                {tareasDia.length > 0 && (
                  <View style={[
                    styles.tareaDot,
                    { backgroundColor: seleccionado ? '#fff' : COLORS.primary }
                  ]} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity onPress={() => setSemanaOffset(semanaOffset + 1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.diaHeader}>
        <Text style={styles.diaHeaderText}>
          {diaSeleccionado.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={styles.diaHeaderCount}>
          {tareasDiaSeleccionado.length} tareas
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tareasDiaSeleccionado.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Sin tareas este día</Text>
            <Text style={styles.emptyDesc}>No hay tareas programadas para este día</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {tareasDiaSeleccionado.map(t => {
              const estadoInfo = getEstadoInfo(t.estado)
              const hijo = hijos.find(h => h.id === t.hijo_id)
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tareaCard, { borderLeftColor: t.hijo_color, borderLeftWidth: 5 }]}
                  onPress={() => hijo && navigation.navigate('DetalleTarea', { tarea: t, hijo })}
                >
                  <View style={styles.tareaTop}>
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
                  {t.materia_nombre && (
                    <Text style={styles.materiaText}>📚 {t.materia_nombre}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
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
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  headerMes: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  semanaContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, paddingVertical: 12,
    paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  navBtn: { padding: 8 },
  diasRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  diaBtn: {
    alignItems: 'center', padding: 6, borderRadius: 12, minWidth: 36, gap: 2
  },
  diaNombre: { fontSize: 11, color: COLORS.textTertiary },
  diaNum: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  tareaDot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
  diaHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12
  },
  diaHeaderText: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, textTransform: 'capitalize' },
  diaHeaderCount: {
    fontSize: 12, color: COLORS.textSecondary,
    backgroundColor: COLORS.surface, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border
  },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  grid: {
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
  tareaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  estadoText: { fontSize: 11, fontWeight: '500' },
  tareaTitulo: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 18 },
  materiaText: { fontSize: 11, color: COLORS.textSecondary },
})