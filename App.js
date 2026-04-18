import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { initDB } from './src/database/db'
import AppNavigator from './src/navigation/AppNavigator'
import { pedirPermisos } from './src/utils/notificaciones'

export default function App() {
  useEffect(() => {
    initDB()
    pedirPermisos()

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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  )
}