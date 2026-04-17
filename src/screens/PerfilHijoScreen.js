import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Modal, TextInput, Alert, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import db from '../database/db'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

const TABS = ['Materias', 'Tareas', 'Recordatorios']

const COLORES_MATERIA = [
  '#5B4FCF', '#1D9E75', '#E24B4A', '#BA7517',
  '#185FA5', '#993556', '#0F6E56', '#712B13'
]

const MATERIAS_SUGERIDAS = [
  'Matemáticas', 'Lenguaje', 'Ciencias Naturales',
  'Estudios Sociales', 'Inglés', 'Educación Física',
  'Religión', 'Arte', 'Informática'
]

export default function PerfilHijoScreen({ route, navigation }) {
  const { hijo } = route.params
  const [tabActiva, setTabActiva] = useState('Materias')
  const [materias, setMaterias] = useState([])
  const [tareas, setTareas] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [nombreMateria, setNombreMateria] = useState('')
  const [colorMateria, setColorMateria] = useState(COLORES_MATERIA[0])

  useFocusEffect(
    useCallback(() => {
      cargarMaterias()
      cargarTareas()
    }, [])
  )

  const cargarMaterias = () => {
    const resultado = db.getAllSync(
      'SELECT * FROM materias WHERE hijo_id = ? ORDER BY nombre ASC',
      [hijo.id]
    )
    setMaterias(resultado)
  }

  const cargarTareas = () => {
    const resultado = db.getAllSync(
      `SELECT t.*, m.nombre as materia_nombre, m.color as materia_color
      FROM tareas t
      LEFT JOIN materias m ON t.materia_id = m.id
      WHERE t.hijo_id = ?
      ORDER BY t.fecha_entrega ASC`,
      [hijo.id]
    )
    setTareas(resultado)
  }

  const guardarMateria = () => {
    if (!nombreMateria.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio')
      return
    }
    db.runSync(
      'INSERT INTO materias (nombre, color, hijo_id) VALUES (?, ?, ?)',
      [nombreMateria.trim(), colorMateria, hijo.id]
    )
    setNombreMateria('')
    setColorMateria(COLORES_MATERIA[0])
    setModalVisible(false)
    cargarMaterias()
  }

  const eliminarMateria = (id, nombre) => {
    Alert.alert('Eliminar', `¿Eliminar ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM materias WHERE id = ?', [id])
          cargarMaterias()
        }
      }
    ])
  }

  const getPrioridadColor = (prioridad) => {
    if (prioridad === 'alta') return COLORS.danger
    if (prioridad === 'media') return COLORS.warning
    return COLORS.secondary
  }

  const renderMaterias = () => (
    <View style={styles.tabContent}>
      {materias.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Sin materias</Text>
          <Text style={styles.emptyDesc}>Agregá las materias de {hijo.nombre}</Text>
        </View>
      ) : (
        materias.map(m => (
          <TouchableOpacity
            key={m.id}
            style={styles.materiaCard}
            onLongPress={() => eliminarMateria(m.id, m.nombre)}
          >
            <View style={[styles.materiaColor, { backgroundColor: m.color }]} />
            <Text style={styles.materiaNombre}>{m.nombre}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))
      )}
    </View>
  )

  const renderTareas = () => (
    <View style={styles.tabContent}>
      {tareas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Sin tareas</Text>
          <Text style={styles.emptyDesc}>No hay tareas registradas aún</Text>
        </View>
      ) : (
        tareas.map(t => (
          <TouchableOpacity
            key={t.id}
            style={styles.tareaCard}
            onPress={() => navigation.navigate('DetalleTarea', { tarea: t, hijo })}
          >
            <View style={[styles.prioridadBar, { backgroundColor: getPrioridadColor(t.prioridad) }]} />
            <View style={styles.tareaInfo}>
              <Text style={styles.tareaTitulo}>{t.titulo}</Text>
              <View style={styles.tareaMetaRow}>
                {t.materia_nombre && (
                  <View style={[styles.materiaBadge, { backgroundColor: t.materia_color + '22' }]}>
                    <Text style={[styles.materiaBadgeText, { color: t.materia_color }]}>
                      {t.materia_nombre}
                    </Text>
                  </View>
                )}
                {t.fecha_entrega && (
                  <Text style={styles.fechaText}>📅 {t.fecha_entrega}</Text>
                )}
              </View>
            </View>
            <View style={[styles.estadoBadge,
              t.estado === 'pendiente' ? styles.estadoPendiente :
              t.estado === 'entregada' ? styles.estadoEntregada : styles.estadoVencida
            ]}>
              <Text style={styles.estadoText}>{t.estado}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  )

  const renderRecordatorios = () => (
    <View style={styles.tabContent}>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>Sin recordatorios</Text>
        <Text style={styles.emptyDesc}>Los recordatorios aparecen aquí</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: hijo.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarGrande}>
            <Text style={styles.avatarTexto}>{hijo.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerNombre}>{hijo.nombre}</Text>
          <Text style={styles.headerGrado}>{hijo.grado}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{materias.length}</Text>
            <Text style={styles.statLabel}>Materias</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{tareas.length}</Text>
            <Text style={styles.statLabel}>Tareas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {tareas.filter(t => t.estado === 'pendiente').length}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, tabActiva === tab && styles.tabActiva]}
            onPress={() => setTabActiva(tab)}
          >
            <Text style={[styles.tabText, tabActiva === tab && styles.tabTextActiva]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll}>
        {tabActiva === 'Materias' && renderMaterias()}
        {tabActiva === 'Tareas' && renderTareas()}
        {tabActiva === 'Recordatorios' && renderRecordatorios()}
      </ScrollView>

      {(tabActiva === 'Materias' || tabActiva === 'Tareas') && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: hijo.color }]}
          onPress={() => {
            if (tabActiva === 'Materias') setModalVisible(true)
            if (tabActiva === 'Tareas') navigation.navigate('AgregarTarea', { hijo })
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nueva materia</Text>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Matemáticas"
              placeholderTextColor={COLORS.textTertiary}
              value={nombreMateria}
              onChangeText={setNombreMateria}
            />

            <Text style={styles.inputLabel}>Sugerencias</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {MATERIAS_SUGERIDAS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.sugerenciaPill}
                  onPress={() => setNombreMateria(s)}
                >
                  <Text style={styles.sugerenciaText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.coloresRow}>
              {COLORES_MATERIA.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    colorMateria === c && styles.colorCircleActive
                  ]}
                  onPress={() => setColorMateria(c)}
                />
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, { backgroundColor: hijo.color }]}
                onPress={guardarMateria}
              >
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerInfo: { alignItems: 'center', marginBottom: 16 },
  avatarGrande: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8
  },
  avatarTexto: { fontSize: 32, fontWeight: '500', color: '#fff' },
  headerNombre: { fontSize: 22, fontWeight: '500', color: '#fff' },
  headerGrado: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, padding: 12, justifyContent: 'space-around'
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '500', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActiva: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActiva: { color: COLORS.primary, fontWeight: '500' },
  scroll: { flex: 1 },
  tabContent: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  materiaCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: COLORS.border
  },
  materiaColor: { width: 12, height: 12, borderRadius: 6 },
  materiaNombre: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  tareaCard: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden'
  },
  prioridadBar: { width: 4, alignSelf: 'stretch' },
  tareaInfo: { flex: 1, padding: 12 },
  tareaTitulo: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  tareaMetaRow: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  materiaBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  materiaBadgeText: { fontSize: 11, fontWeight: '500' },
  fechaText: { fontSize: 11, color: COLORS.textSecondary },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, margin: 12, borderRadius: 8 },
  estadoPendiente: { backgroundColor: '#FAEEDA' },
  estadoEntregada: { backgroundColor: '#EAF3DE' },
  estadoVencida: { backgroundColor: '#FCEBEB' },
  estadoText: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center'
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, gap: 12
  },
  modalTitle: { fontSize: 20, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: COLORS.textPrimary,
    backgroundColor: COLORS.background
  },
  sugerenciaPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.background
  },
  sugerenciaText: { fontSize: 13, color: COLORS.textSecondary },
  coloresRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorCircleActive: { borderWidth: 3, borderColor: COLORS.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancelar: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center'
  },
  btnCancelarText: { fontSize: 15, color: COLORS.textSecondary },
  btnGuardar: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnGuardarText: { fontSize: 15, color: '#fff', fontWeight: '500' },
})