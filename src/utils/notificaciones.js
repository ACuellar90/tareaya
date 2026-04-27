import * as Notifications from 'expo-notifications'
import messaging from '@react-native-firebase/messaging'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function pedirPermisos() {
  // Pedir permisos de Firebase
  const authStatus = await messaging().requestPermission()
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (!enabled) return false

  // Pedir permisos de notificaciones locales
  const { status: existente } = await Notifications.getPermissionsAsync()
  let status = existente

  if (existente !== 'granted') {
    const { status: nuevo } = await Notifications.requestPermissionsAsync()
    status = nuevo
  }

  if (status !== 'granted') return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tareas', {
      name: 'Tareas y recordatorios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    })
  }

  return true
}

export async function getFCMToken() {
  try {
    const token = await messaging().getToken()
    return token
  } catch (e) {
    console.log('Error obteniendo FCM token:', e)
    return null
  }
}

export async function programarNotificacion(titulo, cuerpo, fecha, id) {
  const permiso = await pedirPermisos()
  if (!permiso) return null

  const ahora = new Date()
  if (fecha <= ahora) return null

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: true,
      priority: 'max',
      data: { id },
    },
    trigger: {
      type: 'date',
      date: fecha,
      channelId: 'tareas',
    },
  })

  return notifId
}

export async function programarNotificacionDiaria(titulo, cuerpo, hora, minuto, id) {
  const permiso = await pedirPermisos()
  if (!permiso) return null

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: true,
      priority: 'max',
      data: { id },
    },
    trigger: {
      type: 'daily',
      hour: hora,
      minute: minuto,
      channelId: 'tareas',
    },
  })

  return notifId
}

export async function cancelarNotificacion(notifId) {
  if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId)
}

export async function cancelarTodasNotificaciones() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}