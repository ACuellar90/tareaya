import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initDB } from './src/database/db'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  useEffect(() => {
    initDB()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  )
}