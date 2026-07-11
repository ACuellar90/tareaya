import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import * as Notifications from 'expo-notifications'
import db from '../database/db'

const BACKGROUND_FETCH_TASK = 'background-fetch-tareas'

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
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
      db.runSync('UPDATE recordatorios SET activo = 0 WHERE id = ?', [r.id])
    }

    const extrasPendientes = db.getAllSync(
      `SELECT * FROM recordatorios_extras WHERE fecha_hora <= ? AND activo = 1`,
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
      db.runSync('UPDATE recordatorios_extras SET activo = 0 WHERE id = ?', [r.id])
    }

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (e) {
    console.log('Background fetch error:', e)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function registrarBackgroundFetch() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    })
    console.log('Background fetch registrado')
  } catch (e) {
    console.log('Error registrando background fetch:', e)
  }
}