import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { Linking, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { initDB } from './src/database/db'
import AppNavigator from './src/navigation/AppNavigator'
import { pedirPermisos } from './src/utils/notificaciones'
import { registrarBackgroundFetch } from './src/utils/backgroundService'
import { COLORS } from './src/constants/colors'
import SeleccionRolScreen from './src/screens/SeleccionRolScreen'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function App() {
  const [mostrarGuiaXiaomi, setMostrarGuiaXiaomi] = useState(false)
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const [cargandoRol, setCargandoRol] = useState(true)

  useEffect(() => {
    initDB()
    pedirPermisos()
    registrarBackgroundFetch()
    verificarXiaomi()
    cargarRol()

    const subscription = Notifications.addNotificationReceivedListener(notif => {
      console.log('Notificación recibida:', notif)
    })

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario tocó notificación:', response)
    })

    return () => {
      subscription.remove()
      responseSubscription.remove()
    }
  }, [])

  const cargarRol = async () => {
    const rolGuardado = await AsyncStorage.getItem('usuario_rol')
    setRolSeleccionado(rolGuardado)
    setCargandoRol(false)
  }

  const verificarXiaomi = async () => {
    const fabricante = await DeviceInfo.getManufacturer()
    if (fabricante.toLowerCase().includes('xiaomi') ||
        fabricante.toLowerCase().includes('redmi') ||
        fabricante.toLowerCase().includes('poco')) {
      const omitida = await AsyncStorage.getItem('guia_xiaomi_omitida')
      if (omitida !== 'true') {
        setMostrarGuiaXiaomi(true)
      }
    }
  }

  const omitGuide = async () => {
    await AsyncStorage.setItem('guia_xiaomi_omitida', 'true')
    setMostrarGuiaXiaomi(false)
  }

  const abrirInicioAutomatico = async () => {
    const intentos = [
      'intent:#Intent;action=com.miui.securitycenter.permission.AutoStartActivity;end',
      'intent:#Intent;component=com.miui.securitycenter/.permission.AutoStartActivity;end',
      'intent:#Intent;action=miui.intent.action.OP_AUTO_START;end',
    ]

    const intentarAbrir = async (index) => {
      if (index >= intentos.length) {
        Linking.openSettings()
        return
      }
      try {
        const canOpen = await Linking.canOpenURL(intentos[index])
        if (canOpen) {
          await Linking.openURL(intentos[index])
        } else {
          intentarAbrir(index + 1)
        }
      } catch (e) {
        intentarAbrir(index + 1)
      }
    }

    await intentarAbrir(0)
    await AsyncStorage.setItem('guia_xiaomi_omitida', 'true')
    setMostrarGuiaXiaomi(false)
  }

  const manejarSeleccionRol = (rol) => {
    setRolSeleccionado(rol)
    setCargandoRol(false)
  }

  if (cargandoRol) {
    return null
  }

  if (!rolSeleccionado) {
    return (
      <SafeAreaProvider>
        <SeleccionRolScreen onSelectRole={manejarSeleccionRol} />
      </SafeAreaProvider>
    )
  }

  if (mostrarGuiaXiaomi) {
    return (
      <SafeAreaProvider>
        <View style={styles.guiaContainer}>
          <Text style={styles.guiaEmoji}>🔔</Text>
          <Text style={styles.guiaTitulo}>Activá los recordatorios</Text>
          <Text style={styles.guiaDesc}>
            Tu celular Xiaomi/Redmi bloquea las notificaciones por defecto.
            Para recibir tus recordatorios a tiempo, necesitás activar el
            <Text style={styles.guiaBold}> Inicio Automático</Text> de TareaYa.
          </Text>
          <View style={styles.guiaPasos}>
            <Text style={styles.guiaPaso}>1. Tocá "Activar ahora"</Text>
            <Text style={styles.guiaPaso}>2. Buscá TareaYa en la lista</Text>
            <Text style={styles.guiaPaso}>3. Activá el switch</Text>
            <Text style={styles.guiaPaso}>4. Volvé a la app</Text>
          </View>
          <TouchableOpacity
            style={styles.guiaBtn}
            onPress={abrirInicioAutomatico}
          >
            <Text style={styles.guiaBtnText}>Activar ahora</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guiaBtnSkip}
            onPress={omitGuide}
          >
            <Text style={styles.guiaBtnSkipText}>Omitir por ahora</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator rol={rolSeleccionado} />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  guiaContainer: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    padding: 32
  },
  guiaEmoji: { fontSize: 64, marginBottom: 16 },
  guiaTitulo: {
    fontSize: 24, fontWeight: '700',
    color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16
  },
  guiaDesc: {
    fontSize: 15, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 24, marginBottom: 24
  },
  guiaBold: { fontWeight: '700', color: COLORS.textPrimary },
  guiaPasos: {
    backgroundColor: COLORS.background, borderRadius: 16,
    padding: 16, width: '100%', marginBottom: 24, gap: 8
  },
  guiaPaso: { fontSize: 14, color: COLORS.textPrimary },
  guiaBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 32,
    paddingVertical: 16, borderRadius: 16, width: '100%',
    alignItems: 'center', marginBottom: 12
  },
  guiaBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  guiaBtnSkip: { paddingVertical: 8 },
  guiaBtnSkipText: { color: COLORS.textSecondary, fontSize: 14 },
})