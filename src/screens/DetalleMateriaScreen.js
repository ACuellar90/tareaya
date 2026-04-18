import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { COLORS } from '../constants/colors'
import db from '../database/db'

export default function DetalleMateriaScreen({ route, navigation }) {
  const { materia, hijo } = route.params
  const [tareas, setTareas] = useState([])

  useFocusEffect(
    useCallback(() => {
      cargarTareas()
    }, [])
  )

  const cargarTareas = () => {
    const resultado = db.getAllSync(
      `SELECT * FROM tareas WHERE materia_id = ? AND hijo_id = ? ORDER BY fecha_entrega ASC`,
      [materia.id, hijo.id]
    )
    setTareas(resultado)
  }

  const getEstadoInfo = (estado) => {
    if (estado === 'entregada') return { color: '#1D9E75', bg: '#E1F5EE', label: 'Entregada' }
    if (estado === 'en_progreso') return { color: '#185FA5', bg: '#E6F1FB', label: 'En progreso' }
    if (estado === 'vencida') return { color: '#E24B4A', bg: '#FCEBEB', label: 'Vencida' }
    return { color: '#BA7517', bg: '#FAEEDA', label: 'Pendiente' }
  }

  const getPrioridadColor = (prioridad) => {
    if (prioridad === 'alta') return '#E24B4A'
    if (prioridad === 'media') return '#BA7517'
    return '#1D9E75'
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: materia.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitulo}>{materia.nombre}</Text>
          <Text style={styles.headerSub}>{hijo.nombre} · {tareas.length} tareas</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AgregarTarea', { hijo, materiaPreseleccionada: materia.id })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tareas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Sin tareas</Text>
            <Text style={styles.emptyDesc}>No hay tareas en {materia.nombre} todavía</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: materia.color }]}
              onPress={() => navigation.navigate('AgregarTarea', { hijo, materiaPreseleccionada: materia.id })}
            >
              <Text style={styles.emptyBtnText}>+ Agregar tarea</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {tareas.map(t => {
              const estadoInfo = getEstadoInfo(t.estado)
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tareaCard, { borderLeftColor: materia.color, borderLeftWidth: 5 }]}
                  onPress={() => navigation.navigate('DetalleTarea', { tarea: t, hijo })}
                >
                  <View style={styles.tareaTop}>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                      <Text style={[styles.estadoText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
                    </View>
                    <View style={[styles.prioridadDot, { backgroundColor: getPrioridadColor(t.prioridad) }]} />
                  </View>
                  <Text style={styles.tareaTitulo}>{t.titulo}</Text>
                  {t.fecha_entrega && (
                    <Text style={styles.fechaText}>📅 {t.fecha_entrega}</Text>
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
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12
  },
  headerBody: { flex: 1 },
  headerTitulo: { fontSize: 20, fontWeight: '500', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center'
  },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  tareaCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 12, gap: 6, borderWidth: 0.5,
    borderColor: COLORS.border, overflow: 'hidden', width: '47%',
  },
  tareaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  estadoText: { fontSize: 11, fontWeight: '500' },
  prioridadDot: { width: 8, height: 8, borderRadius: 4 },
  tareaTitulo: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 18 },
  fechaText: { fontSize: 11, color: COLORS.textSecondary },
})