import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Switch, Alert, Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { COLORS } from '../constants/colors'

const VERSION = '1.0.0'
const WHATSAPP = '50300000000' // cambiá por tu número
const CORREO = 'tareaya.app@gmail.com'

export default function AjustesScreen() {
  const [nombre, setNombre] = useState('')
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [notificaciones, setNotificaciones] = useState(true)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    cargarAjustes()
  }, [])

  const cargarAjustes = async () => {
    const nombreGuardado = await AsyncStorage.getItem('nombre_tutor')
    const notifGuardada = await AsyncStorage.getItem('notificaciones')
    const premiumGuardado = await AsyncStorage.getItem('premium')
    if (nombreGuardado) setNombre(nombreGuardado)
    if (notifGuardada !== null) setNotificaciones(notifGuardada === 'true')
    if (premiumGuardado !== null) setPremium(premiumGuardado === 'true')
  }

  const guardarNombre = async () => {
    await AsyncStorage.setItem('nombre_tutor', nombre)
    setEditandoNombre(false)
  }

  const toggleNotificaciones = async (valor) => {
    setNotificaciones(valor)
    await AsyncStorage.setItem('notificaciones', valor.toString())
  }

  const abrirWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP}?text=Hola, necesito ayuda con TareaYa`)
  }

  const abrirCorreo = () => {
    Linking.openURL(`mailto:${CORREO}?subject=Soporte TareaYa`)
  }

  const desbloquearPremium = () => {
    Alert.alert(
      '🌟 TareaYa Premium',
      'Desbloqueá todas las funciones por un pago único de $4.\n\n✅ Hijos ilimitados\n✅ Tareas ilimitadas\n✅ Recordatorios push\n✅ Sin anuncios',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear $4', onPress: async () => {
            await AsyncStorage.setItem('premium', 'true')
            setPremium(true)
            Alert.alert('¡Gracias!', 'TareaYa Premium activado 🎉')
          }
        }
      ]
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mi perfil</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="person" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Nombre del tutor</Text>
              {editandoNombre ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.textTertiary}
                    autoFocus
                  />
                  <TouchableOpacity onPress={guardarNombre} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditandoNombre(true)}>
                  <Text style={styles.rowValue}>
                    {nombre || 'Toca para agregar tu nombre'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notificaciones</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#FAEEDA' }]}>
              <Ionicons name="notifications" size={18} color="#BA7517" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Recordatorios activos</Text>
              <Text style={styles.rowDesc}>Recibir alertas de tareas y fechas</Text>
            </View>
            <Switch
              value={notificaciones}
              onValueChange={toggleNotificaciones}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
              thumbColor={notificaciones ? COLORS.primary : COLORS.textTertiary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Plan</Text>
        <View style={styles.card}>
          {premium ? (
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#FAEEDA' }]}>
                <Ionicons name="star" size={18} color="#BA7517" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>TareaYa Premium</Text>
                <Text style={[styles.rowDesc, { color: '#1D9E75' }]}>✅ Activo — todas las funciones desbloqueadas</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.row} onPress={desbloquearPremium}>
              <View style={[styles.rowIcon, { backgroundColor: '#FAEEDA' }]}>
                <Ionicons name="star-outline" size={18} color="#BA7517" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Desbloquear Premium</Text>
                <Text style={styles.rowDesc}>$4 pago único · hijos y tareas ilimitadas</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Soporte</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={abrirWhatsApp}>
            <View style={[styles.rowIcon, { backgroundColor: '#E1F5EE' }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#1D9E75" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>WhatsApp</Text>
              <Text style={styles.rowDesc}>Escribinos directo</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={abrirCorreo}>
            <View style={[styles.rowIcon, { backgroundColor: '#E6F1FB' }]}>
              <Ionicons name="mail" size={18} color="#185FA5" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Correo</Text>
              <Text style={styles.rowDesc}>{CORREO}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Acerca de</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>TareaYa</Text>
              <Text style={styles.rowDesc}>Versión {VERSION} · Hecho en El Salvador 🇸🇻</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 0.5, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '500', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden'
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  rowDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowValue: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginLeft: 62 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  input: {
    flex: 1, borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 8, padding: 8, fontSize: 14, color: COLORS.textPrimary,
    backgroundColor: COLORS.background
  },
  saveBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 8
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
})