import BackgroundActions from 'react-native-background-actions'
import * as Notifications from 'expo-notifications'
import db from '../database/db'

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const verificarRecordatorios = async () => {
  try {
    const ahora = new Date()
    const ahoraStr = ahora.toISOString()

    const recordatoriosPendientes = db.getAllSync(
      `SELECT r.*, t.titulo as tarea_titulo
       FROM recordatorios r
       JOIN tareas t ON r.tarea_id = t.id
       WHERE r.fecha_hora <= ? AND r.activo = 1
       ORDER BY r.fecha_hora ASC`,
      [ahoraStr]
    )

    for (const r of recordatoriosPendientes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 TareaYa',
          body: r.tarea_titulo,
          sound: 'default',
          priority: 'max',
        },
        trigger: null,
      })

      db.runSync(
        'UPDATE recordatorios SET activo = 0 WHERE id = ?',
        [r.id]
      )
    }

    const extrasPendientes = db.getAllSync(
      `SELECT * FROM recordatorios_extras
       WHERE fecha_hora <= ? AND activo = 1`,
      [ahoraStr]
    )

    for (const r of extrasPendientes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 ${r.titulo}`,
          body: r.descripcion || 'Recordatorio',
          sound: 'default',
          priority: 'max',
        },
        trigger: null,
      })

      db.runSync(
        'UPDATE recordatorios_extras SET activo = 0 WHERE id = ?',
        [r.id]
      )
    }
  } catch (e) {
    console.log('Error verificando recordatorios:', e)
  }
}

const tareaBackground = async (taskData) => {
  while (BackgroundActions.isRunning()) {
    await verificarRecordatorios()
    await sleep(60000) // revisar cada minuto
  }
}

const opciones = {
  taskName: 'TareaYa',
  taskTitle: 'TareaYa activo',
  taskDesc: 'Monitoreando recordatorios',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#5B4FCF',
  parameters: {
    delay: 60000,
  },
}

export const iniciarServicioBackground = async () => {
  try {
    await BackgroundActions.start(tareaBackground, opciones)
  } catch (e) {
    console.log('Error iniciando background service:', e)
  }
}

export const detenerServicioBackground = async () => {
  try {
    await BackgroundActions.stop()
  } catch (e) {
    console.log('Error deteniendo background service:', e)
  }
}