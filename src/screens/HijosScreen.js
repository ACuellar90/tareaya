import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Modal, TextInput, ScrollView, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { COLORS } from '../constants/colors'
import db from '../database/db'

const COLORES_PERFIL = [
  '#5B4FCF', '#1D9E75', '#E24B4A', '#BA7517',
  '#185FA5', '#993556', '#0F6E56', '#712B13'
]

const GRADOS = [
  'Parvularia', '1° Grado', '2° Grado', '3° Grado',
  '4° Grado', '5° Grado', '6° Grado',
  '7° Grado', '8° Grado', '9° Grado',
  '1° Bachillerato', '2° Bachillerato', '3° Bachillerato'
]

export default function HijosScreen({ navigation }) {
  const [hijos, setHijos] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [nombre, setNombre] = useState('')
  const [gradoSeleccionado, setGradoSeleccionado] = useState('')
  const [colorSeleccionado, setColorSeleccionado] = useState(COLORES_PERFIL[0])

  useEffect(() => {
    cargarHijos()
  }, [])

  const cargarHijos = () => {
    const resultado = db.getAllSync('SELECT * FROM hijos ORDER BY nombre ASC')
    setHijos(resultado)
  }

  const guardarHijo = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio')
      return
    }
    if (!gradoSeleccionado) {
      Alert.alert('Error', 'Seleccioná un grado')
      return
    }
    db.runSync(
      'INSERT INTO hijos (nombre, grado, color) VALUES (?, ?, ?)',
      [nombre.trim(), gradoSeleccionado, colorSeleccionado]
    )
    setNombre('')
    setGradoSeleccionado('')
    setColorSeleccionado(COLORES_PERFIL[0])
    setModalVisible(false)
    cargarHijos()
  }

  const eliminarHijo = (id, nombre) => {
    Alert.alert(
      'Eliminar',
      `¿Seguro que querés eliminar a ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => {
            db.runSync('DELETE FROM hijos WHERE id = ?', [id])
            cargarHijos()
          }
        }
      ]
    )
  }

  const renderHijo = ({ item }) => (
    <TouchableOpacity
      style={styles.hijoCard}
      onPress={() => navigation.navigate('PerfilHijo', { hijo: item })}
      onLongPress={() => eliminarHijo(item.id, item.nombre)}
    >
      <View style={[styles.avatar, { backgroundColor: item.color }]}>
        <Text style={styles.avatarText}>
          {item.nombre.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.hijoInfo}>
        <Text style={styles.hijoNombre}>{item.nombre}</Text>
        <Text style={styles.hijoGrado}>{item.grado}</Text>
      </View>
      <View style={[styles.gradoBadge, { backgroundColor: item.color + '22' }]}>
        <Text style={[styles.gradoBadgeText, { color: item.color }]}>
          {item.grado.split(' ')[0]}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis hijos</Text>
        <TouchableOpacity
          style={styles.btnAgregar}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.btnAgregarText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {hijos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👨‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>Sin hijos registrados</Text>
          <Text style={styles.emptyDesc}>Tocá "Agregar" para registrar tu primer hijo</Text>
        </View>
      ) : (
        <FlatList
          data={hijos}
          keyExtractor={item => item.id.toString()}
          renderItem={renderHijo}
          contentContainerStyle={styles.lista}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Nuevo hijo</Text>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del hijo"
              placeholderTextColor={COLORS.textTertiary}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.inputLabel}>Grado</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gradoScroll}
            >
              {GRADOS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.gradoPill,
                    gradoSeleccionado === g && styles.gradoPillActive
                  ]}
                  onPress={() => setGradoSeleccionado(g)}
                >
                  <Text style={[
                    styles.gradoPillText,
                    gradoSeleccionado === g && styles.gradoPillTextActive
                  ]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Color de perfil</Text>
            <View style={styles.coloresRow}>
              {COLORES_PERFIL.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    colorSeleccionado === c && styles.colorCircleActive
                  ]}
                  onPress={() => setColorSeleccionado(c)}
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
                style={styles.btnGuardar}
                onPress={guardarHijo}
              >
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
         </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 60,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  btnAgregar: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20
  },
  btnAgregarText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  lista: { padding: 16, gap: 12 },
  hijoCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border, gap: 12
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 20, fontWeight: '500', color: '#fff' },
  hijoInfo: { flex: 1 },
  hijoNombre: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
  hijoGrado: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  gradoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  gradoBadgeText: { fontSize: 12, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12
  },
  modalTitle: { fontSize: 20, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: COLORS.textPrimary,
    backgroundColor: COLORS.background
  },
  gradoScroll: { marginBottom: 4 },
  gradoPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.background
  },
  gradoPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  gradoPillText: { fontSize: 13, color: COLORS.textSecondary },
  gradoPillTextActive: { color: '#fff' },
  coloresRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorCircleActive: { borderWidth: 3, borderColor: COLORS.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancelar: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center'
  },
  btnCancelarText: { fontSize: 15, color: COLORS.textSecondary },
  btnGuardar: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center'
  },
  btnGuardarText: { fontSize: 15, color: '#fff', fontWeight: '500' },
})