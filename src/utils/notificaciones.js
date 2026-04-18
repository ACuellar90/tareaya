import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function pedirPermisos() {
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
    })
  }

  return true
}

export async function programarNotificacion(titulo, cuerpo, fecha, id) {
  const permiso = await pedirPermisos()
  if (!permiso) return null

  const ahora = new Date()
  if (fecha <= ahora) return null

  const segundos = Math.floor((fecha - ahora) / 1000)

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: true,
      data: { id },
    },
    trigger: {
      seconds: segundos,
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
      data: { id },
    },
    trigger: {
      hour: hora,
      minute: minuto,
      repeats: true,
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