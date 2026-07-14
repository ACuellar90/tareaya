import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, TextInput, Switch, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { COLORS } from '../constants/colors'

const REPETICIONES = [
  { id: 'una_vez', label: 'Una sola vez' },
  { id: 'diario', label: 'Todos los días' },
  { id: 'lunes_viernes', label: 'Lunes a viernes' },
  { id: 'semanal', label: 'Semanalmente' },
  { id: 'cada_2_dias', label: 'Cada 2 días' },
  { id: 'cada_3_dias', label: 'Cada 3 días' },
]

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lun' },
  { id: 'martes', label: 'Mar' },
  { id: 'miercoles', label: 'Mié' },
  { id: 'jueves', label: 'Jue' },
  { id: 'viernes', label: 'Vie' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
]

export default function RecordatorioModal({
  visible,
  onClose,
  onGuardar,
  recordatorio = null,
  fechaEntrega = new Date(),
  hijoColor = '#5B4FCF'
}) {
  const [fecha, setFecha] = useState(recordatorio?.fecha || new Date())
  const [mostrarFecha, setMostrarFecha] = useState(false)
  const [mostrarHora, setMostrarHora] = useState(false)
  const [repeticion, setRepeticion] = useState(recordatorio?.repeticion || 'una_vez')
  const [dias, setDias] = useState(recordatorio?.dias ? recordatorio.dias.split(',') : [])
  const [mensaje, setMensaje] = useState(recordatorio?.mensaje || '')
  const [activo, setActivo] = useState(recordatorio?.activo !== false)

  const toggleDia = (dia) => {
    if (dias.includes(dia)) {
      setDias(dias.filter(d => d !== dia))
    } else {
      setDias([...dias, dia])
    }
  }

  const formatFecha = (d) => {
    return d.toLocaleDateString('es-SV', {
      weekday: 'short', day: '2-digit', month: '2-digit'
    })
  }

  const formatHora = (d) => {
    return d.toLocaleTimeString('es-SV', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const validar = () => {
    if (fecha <= new Date() && repeticion === 'una_vez') {
      Alert.alert('Error', 'La fecha y hora deben ser en el futuro')
      return false
    }
    if (repeticion === 'semanal' && dias.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un día de la semana')
      return false
    }
    return true
  }

  const handleGuardar = () => {
    if (!validar()) return

    const data = {
      fecha,
      repeticion,
      dias: dias.join(','),
      mensaje,
      activo,
      label: generarLabel()
    }

    onGuardar(data, recordatorio?.index)
    onClose()
  }

  const generarLabel = () => {
    const hora = formatHora(fecha)
    if (repeticion === 'una_vez') {
      return `${formatFecha(fecha)} · ${hora}`
    }
    if (repeticion === 'diario') {
      return `Todos los días · ${hora}`
    }
    if (repeticion === 'lunes_viernes') {
      return `Lun-Vie · ${hora}`
    }
    if (repeticion === 'semanal') {
      const diasLabel = dias.map(d => DIAS_SEMANA.find(dj => dj.id === d)?.label).join(', ')
      return `${diasLabel} · ${hora}`
    }
    if (repeticion === 'cada_2_dias') {
      return `Cada 2 días · ${hora}`
    }
    if (repeticion === 'cada_3_dias') {
      return `Cada 3 días · ${hora}`
    }
    return hora
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: hijoColor }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {recordatorio ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </Text>
          <TouchableOpacity onPress={handleGuardar} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Fecha */}
          <View style={styles.section}>
            <Text style={styles.label}>📅 Fecha</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setMostrarFecha(true)}
            >
              <Ionicons name="calendar" size={18} color={hijoColor} />
              <Text style={[styles.datePickerText, { color: hijoColor }]}>
                {formatFecha(fecha)}
              </Text>
            </TouchableOpacity>
            {mostrarFecha && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setMostrarFecha(false)
                  if (selectedDate) {
                    const newDate = new Date(fecha)
                    newDate.setFullYear(selectedDate.getFullYear())
                    newDate.setMonth(selectedDate.getMonth())
                    newDate.setDate(selectedDate.getDate())
                    setFecha(newDate)
                  }
                }}
              />
            )}
          </View>

          {/* Hora */}
          <View style={styles.section}>
            <Text style={styles.label}>⏰ Hora</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setMostrarHora(true)}
            >
              <Ionicons name="time" size={18} color={hijoColor} />
              <Text style={[styles.datePickerText, { color: hijoColor }]}>
                {formatHora(fecha)}
              </Text>
            </TouchableOpacity>
            {mostrarHora && (
              <DateTimePicker
                value={fecha}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setMostrarHora(false)
                  if (selectedTime) {
                    const newDate = new Date(fecha)
                    newDate.setHours(selectedTime.getHours())
                    newDate.setMinutes(selectedTime.getMinutes())
                    setFecha(newDate)
                  }
                }}
              />
            )}
          </View>

          {/* Repetición */}
          <View style={styles.section}>
            <Text style={styles.label}>🔄 Repetición</Text>
            <View style={styles.repeticionGrid}>
              {REPETICIONES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.repeticionBtn,
                    repeticion === r.id && { backgroundColor: hijoColor + '22', borderColor: hijoColor }
                  ]}
                  onPress={() => setRepeticion(r.id)}
                >
                  <Text style={[
                    styles.repeticionBtnText,
                    repeticion === r.id && { color: hijoColor, fontWeight: '600' }
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Días de la semana (si es semanal) */}
          {repeticion === 'semanal' && (
            <View style={styles.section}>
              <Text style={styles.label}>📆 Selecciona los días</Text>
              <View style={styles.diasGrid}>
                {DIAS_SEMANA.map(dia => (
                  <TouchableOpacity
                    key={dia.id}
                    style={[
                      styles.diaBtn,
                      dias.includes(dia.id) && { backgroundColor: hijoColor, borderColor: hijoColor }
                    ]}
                    onPress={() => toggleDia(dia.id)}
                  >
                    <Text style={[
                      styles.diaBtnText,
                      dias.includes(dia.id) && { color: '#fff', fontWeight: '700' }
                    ]}>
                      {dia.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Mensaje personalizado */}
          <View style={styles.section}>
            <Text style={styles.label}>💬 Mensaje personalizado (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: No olvidar llevar la mochila"
              placeholderTextColor={COLORS.textTertiary}
              value={mensaje}
              onChangeText={setMensaje}
              multiline
            />
          </View>

          {/* Activo */}
          <View style={styles.section}>
            <View style={styles.activoRow}>
              <Text style={styles.label}>✅ Recordatorio activo</Text>
              <Switch
                value={activo}
                onValueChange={setActivo}
                trackColor={{ false: COLORS.border, true: hijoColor + '66' }}
                thumbColor={activo ? hijoColor : COLORS.textTertiary}
              />
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.section, styles.previewBox]}>
            <Text style={styles.previewTitle}>📢 Cómo se verá</Text>
            <Text style={styles.previewLabel}>{generarLabel()}</Text>
            {mensaje && <Text style={styles.previewMsg}>{mensaje}</Text>}
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  repeticionGrid: {
    gap: 8,
  },
  repeticionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  repeticionBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  diasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  diaBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  diaBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 60,
  },
  activoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5B4FCF' + '44',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B4FCF',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewMsg: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  spacer: {
    height: 30,
  },
})
