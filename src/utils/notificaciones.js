import * as Notifications from 'expo-notifications'
import messaging from '@react-native-firebase/messaging'
import { Platform } from 'react-native'

export async function pedirPermisos() {
  const authStatus = await messaging().requestPermission()
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (!enabled) return false

  const { status: existente } = await Notifications.getPermissionsAsync()
  let status = existente

  if (existente !== 'granted') {
    const { status: nuevo } = await Notifications.requestPermissionsAsync()
    status = nuevo
  }

  if (status !== 'granted') return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tareas_v2', {
      name: 'Tareas y recordatorios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableVibrate: true,
      lightColor: '#5B4FCF',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
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
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { id },
    },
    trigger: {
      date: fecha,
      channelId: 'tareas_v2',
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
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { id },
    },
    trigger: {
      hour: hora,
      minute: minuto,
      repeats: true,
      channelId: 'tareas_v2',
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