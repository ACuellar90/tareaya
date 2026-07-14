import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, Platform, FlatList
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { COLORS } from '../constants/colors'
import db from '../database/db'
import { programarNotificacion, programarNotificacionDiaria } from '../utils/notificaciones'
import RecordatorioModal from '../components/RecordatorioModal'

const TIPOS = [
  { id: 'tarea', label: 'Tarea', icon: 'document-text' },
  { id: 'examen', label: 'Examen', icon: 'school' },
  { id: 'proyecto', label: 'Proyecto', icon: 'construct' },
  { id: 'medicamento', label: 'Medicamento', icon: 'medical' },
  { id: 'cita', label: 'Cita médica', icon: 'calendar' },
]

const PRIORIDADES = [
  { id: 'alta', label: 'Alta', color: '#E24B4A' },
  { id: 'media', label: 'Media', color: '#BA7517' },
  { id: 'baja', label: 'Baja', color: '#1D9E75' },
]

export default function AgregarTareaScreen({ route, navigation }) {
  const { hijo } = route.params
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('tarea')
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('media')
  const [materias, setMaterias] = useState([])
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null)
  const [fechaEntrega, setFechaEntrega] = useState(new Date())
  const [mostrarFecha, setMostrarFecha] = useState(false)
  const [recordatorios, setRecordatorios] = useState([])
  const [recordatoriosSugeridos, setRecordatoriosSugeridos] = useState([])
  const [modalVisibleRecordatorio, setModalVisibleRecordatorio] = useState(false)
  const [recordatorioEditando, setRecordatorioEditando] = useState(null)

  useEffect(() => {
    cargarMaterias()
  }, [])

  useEffect(() => {
    generarSugerencias()
  }, [tipoSeleccionado, fechaEntrega])

  const cargarMaterias = () => {
    const resultado = db.getAllSync(
      'SELECT * FROM materias WHERE hijo_id = ? ORDER BY nombre ASC',
      [hijo.id]
    )
    setMaterias(resultado)
  }

  const generarSugerencias = () => {
    const sugeridos = []
    const fecha = new Date(fechaEntrega)

    if (tipoSeleccionado === 'examen' || tipoSeleccionado === 'proyecto') {
      const tresDias = new Date(fecha)
      tresDias.setDate(tresDias.getDate() - 3)
      tresDias.setHours(18, 0, 0)
      sugeridos.push({ label: '3 días antes · 6:00 PM', fecha: tresDias, activo: true, repeticion: 'una_vez', dias: '' })
    }

    if (tipoSeleccionado === 'medicamento') {
      const hoy = new Date()
      hoy.setHours(8, 0, 0)
      sugeridos.push({ label: 'Diario · 8:00 AM', fecha: hoy, activo: true, repeticion: 'diario', dias: '' })
    }

    const unDiaAntes = new Date(fecha)
    unDiaAntes.setDate(unDiaAntes.getDate() - 1)
    unDiaAntes.setHours(18, 0, 0)
    sugeridos.push({ label: '1 día antes · 6:00 PM', fecha: unDiaAntes, activo: true, repeticion: 'una_vez', dias: '' })

    const mismodia = new Date(fecha)
    mismodia.setHours(6, 0, 0)
    sugeridos.push({ label: 'Día de entrega · 6:00 AM', fecha: mismodia, activo: true, repeticion: 'una_vez', dias: '' })

    setRecordatoriosSugeridos(sugeridos)
  }

  const toggleRecordatorio = (index) => {
    const nuevos = [...recordatoriosSugeridos]
    nuevos[index].activo = !nuevos[index].activo
    setRecordatoriosSugeridos(nuevos)
  }

  const agregarRecordatorioPersonalizado = () => {
    setRecordatorioEditando(null)
    setModalVisibleRecordatorio(true)
  }

  const guardarRecordatorio = (data, index) => {
    if (index !== null) {
      // Editar existente
      const nuevos = [...recordatorios]
      nuevos[index] = data
      setRecordatorios(nuevos)
    } else {
      // Agregar nuevo
      setRecordatorios([...recordatorios, data])
    }
  }

  const eliminarRecordatorio = (index) => {
    const nuevos = recordatorios.filter((_, i) => i !== index)
    setRecordatorios(nuevos)
  }

  const formatFecha = (fecha) => {
    return fecha.toLocaleDateString('es-SV', {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric'
    })
  }

  const guardarTarea = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio')
      return
    }

    const fechaStr = fechaEntrega.toISOString().split('T')[0]

    const resultado = db.runSync(
      `INSERT INTO tareas (titulo, descripcion, materia_id, hijo_id, tipo, prioridad, estado, fecha_entrega)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [
        titulo.trim(),
        descripcion.trim(),
        materiaSeleccionada,
        hijo.id,
        tipoSeleccionado,
        prioridadSeleccionada,
        fechaStr
      ]
    )

    const tareaId = resultado.lastInsertRowId
    const mensajeTarea = `${titulo}${materiaSeleccionada ? ' · ' + (materias.find(m => m.id === materiaSeleccionada)?.nombre || '') : ''}`

    // Guardar recordatorios sugeridos activos
    for (const r of recordatoriosSugeridos) {
      if (r.activo) {
        db.runSync(
          `INSERT INTO recordatorios (tarea_id, fecha_hora, mensaje, repeticion, dias)
          VALUES (?, ?, ?, ?, ?)`,
          [
            tareaId,
            r.fecha.toISOString(),
            mensajeTarea,
            r.repeticion || 'una_vez',
            r.dias || ''
          ]
        )

        if (r.repeticion === 'diario') {
          await programarNotificacionDiaria(
            '💊 Medicamento',
            `No olvidés: ${titulo} para ${hijo.nombre}`,
            r.fecha.getHours(),
            r.fecha.getMinutes(),
            tareaId
          )
        } else {
          await programarNotificacion(
            '📚 TareaYa',
            `${hijo.nombre} tiene pendiente: ${titulo}`,
            r.fecha,
            tareaId
          )
        }
      }
    }

    // Guardar recordatorios personalizados
    for (const r of recordatorios) {
      db.runSync(
        `INSERT INTO recordatorios (tarea_id, fecha_hora, mensaje, repeticion, dias)
        VALUES (?, ?, ?, ?, ?)`,
        [
          tareaId,
          r.fecha.toISOString(),
          r.mensaje || mensajeTarea,
          r.repeticion || 'una_vez',
          r.dias || ''
        ]
      )

      if (r.repeticion === 'diario' || r.repeticion === 'lunes_viernes' || r.repeticion === 'cada_2_dias' || r.repeticion === 'cada_3_dias') {
        await programarNotificacionDiaria(
          '🔔 Recordatorio',
          r.mensaje || titulo,
          r.fecha.getHours(),
          r.fecha.getMinutes(),
          tareaId
        )
      } else {
        await programarNotificacion(
          '🔔 Recordatorio',
          r.mensaje || `Recordatorio: ${titulo}`,
          r.fecha,
          tareaId
        )
      }
    }

    Alert.alert('¡Listo!', 'Tarea guardada correctamente', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: hijo.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva tarea</Text>
        <Text style={styles.headerSub}>{hijo.nombre}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Qué hay que hacer?"
            placeholderTextColor={COLORS.textTertiary}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de tarea</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tiposRow}>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tipoBtn, tipoSeleccionado === t.id && { backgroundColor: hijo.color, borderColor: hijo.color }]}
                  onPress={() => setTipoSeleccionado(t.id)}
                >
                  <Ionicons
                    name={t.icon}
                    size={20}
                    color={tipoSeleccionado === t.id ? '#fff' : COLORS.textSecondary}
                  />
                  <Text style={[styles.tipoBtnText, tipoSeleccionado === t.id && { color: '#fff' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Materia</Text>
          {materias.length === 0 ? (
            <Text style={styles.sinMaterias}>Sin materias registradas — agregá materias desde el perfil</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tiposRow}>
                <TouchableOpacity
                  style={[styles.materiaPill, materiaSeleccionada === null && styles.materiaPillActive]}
                  onPress={() => setMateriaSeleccionada(null)}
                >
                  <Text style={[styles.materiaPillText, materiaSeleccionada === null && styles.materiaPillTextActive]}>
                    Sin materia
                  </Text>
                </TouchableOpacity>
                {materias.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.materiaPill,
                      materiaSeleccionada === m.id && { backgroundColor: m.color, borderColor: m.color }
                    ]}
                    onPress={() => setMateriaSeleccionada(m.id)}
                  >
                    <Text style={[
                      styles.materiaPillText,
                      materiaSeleccionada === m.id && { color: '#fff' }
                    ]}>
                      {m.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.prioridadRow}>
            {PRIORIDADES.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.prioridadBtn,
                  prioridadSeleccionada === p.id && { backgroundColor: p.color + '22', borderColor: p.color }
                ]}
                onPress={() => setPrioridadSeleccionada(p.id)}
              >
                <View style={[styles.prioridadDot, { backgroundColor: p.color }]} />
                <Text style={[
                  styles.prioridadText,
                  prioridadSeleccionada === p.id && { color: p.color, fontWeight: '500' }
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha de entrega</Text>
          <TouchableOpacity
            style={styles.fechaBtn}
            onPress={() => setMostrarFecha(true)}
          >
            <Ionicons name="calendar" size={18} color={hijo.color} />
            <Text style={[styles.fechaBtnText, { color: hijo.color }]}>
              {formatFecha(fechaEntrega)}
            </Text>
          </TouchableOpacity>
          {mostrarFecha && (
            <DateTimePicker
              value={fechaEntrega}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, fecha) => {
                setMostrarFecha(false)
                if (fecha) setFechaEntrega(fecha)
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>📌 Recordatorios sugeridos</Text>
          <Text style={styles.sublabel}>Tocá para activar o desactivar</Text>
          {recordatoriosSugeridos.map((r, i) => (
            <View
              key={i}
              style={[styles.recordatorioRow, r.activo && styles.recordatorioActivo]}
            >
              <TouchableOpacity onPress={() => toggleRecordatorio(i)}>
                <Ionicons
                  name={r.activo ? 'notifications' : 'notifications-off-outline'}
                  size={18}
                  color={r.activo ? hijo.color : COLORS.textTertiary}
                />
              </TouchableOpacity>
              <Text style={[styles.recordatorioText, r.activo && { color: COLORS.textPrimary }]}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        {recordatorios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>🎯 Tus recordatorios personalizados</Text>
            {recordatorios.map((r, i) => (
              <View key={i} style={styles.personalizedRecordatorio}>
                <View style={styles.personalizedRecordatorioContent}>
                  <Text style={styles.personalizedRecordatorioLabel}>{r.label}</Text>
                  {r.mensaje && <Text style={styles.personalizedRecordatorioMsg}>{r.mensaje}</Text>}
                </View>
                <View style={styles.personalizedRecordatorioActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setRecordatorioEditando(r)
                      setModalVisibleRecordatorio(true)
                    }}
                    style={styles.editBtn}
                  >
                    <Ionicons name="pencil" size={16} color={hijo.color} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => eliminarRecordatorio(i)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash" size={16} color="#E24B4A" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.btnAgregarRecordatorio, { borderColor: hijo.color }]}
            onPress={agregarRecordatorioPersonalizado}
          >
            <Ionicons name="add-circle" size={20} color={hijo.color} />
            <Text style={[styles.btnAgregarRecordatorioText, { color: hijo.color }]}>
              Agregar recordatorio personalizado
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Detalles de la tarea..."
            placeholderTextColor={COLORS.textTertiary}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.btnGuardar, { backgroundColor: hijo.color }]}
          onPress={guardarTarea}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.btnGuardarText}>Guardar tarea</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <RecordatorioModal
        visible={modalVisibleRecordatorio}
        onClose={() => {
          setModalVisibleRecordatorio(false)
          setRecordatorioEditando(null)
        }}
        onGuardar={guardarRecordatorio}
        recordatorio={recordatorioEditando}
        fechaEntrega={fechaEntrega}
        hijoColor={hijo.color}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '500', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { flex: 1 },
  section: { padding: 16, paddingBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  sublabel: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 8, marginTop: -4 },
  input: {
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: COLORS.textPrimary,
    backgroundColor: COLORS.surface
  },
  inputMultiline: { height: 90, textAlignVertical: 'top' },
  tiposRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  tipoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  tipoBtnText: { fontSize: 13, color: COLORS.textSecondary },
  sinMaterias: { fontSize: 13, color: COLORS.textTertiary, fontStyle: 'italic' },
  materiaPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: 8
  },
  materiaPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  materiaPillText: { fontSize: 13, color: COLORS.textSecondary },
  materiaPillTextActive: { color: '#fff' },
  prioridadRow: { flexDirection: 'row', gap: 10 },
  prioridadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  prioridadDot: { width: 8, height: 8, borderRadius: 4 },
  prioridadText: { fontSize: 13, color: COLORS.textSecondary },
  fechaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 0.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surface
  },
  fechaBtnText: { fontSize: 14, fontWeight: '500' },
  recordatorioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  recordatorioActivo: { borderColor: COLORS.primary + '44', backgroundColor: COLORS.primaryLight },
  recordatorioText: { flex: 1, fontSize: 13, color: COLORS.textTertiary },
  personalizedRecordatorio: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#5B4FCF' + '44',
    backgroundColor: '#5B4FCF' + '11'
  },
  personalizedRecordatorioContent: { flex: 1 },
  personalizedRecordatorioLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 2 },
  personalizedRecordatorioMsg: { fontSize: 11, color: COLORS.textTertiary, fontStyle: 'italic' },
  personalizedRecordatorioActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  btnAgregarRecordatorio: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 12, borderRadius: 12, marginBottom: 16,
    borderWidth: 1.5, borderStyle: 'dashed'
  },
  btnAgregarRecordatorioText: { fontSize: 13, fontWeight: '500' },
  btnGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 16, padding: 16, borderRadius: 16
  },
  btnGuardarText: { fontSize: 16, fontWeight: '500', color: '#fff' },
})