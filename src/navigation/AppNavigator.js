import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../constants/colors'

import HomeScreen from '../screens/HomeScreen'
import HijosScreen from '../screens/HijosScreen'
import TareasScreen from '../screens/TareasScreen'
import AgendaScreen from '../screens/AgendaScreen'
import AjustesScreen from '../screens/AjustesScreen'
import PerfilHijoScreen from '../screens/PerfilHijoScreen'
import AgregarTareaScreen from '../screens/AgregarTareaScreen'
import DetalleTareaScreen from '../screens/DetalleTareaScreen'
import DetalleMateriaScreen from '../screens/DetalleMateriaScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabNavigator() {
  const insets = useSafeAreaInsets()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Inicio: focused ? 'home' : 'home-outline',
            Hijos: focused ? 'people' : 'people-outline',
            Tareas: focused ? 'checkbox' : 'checkbox-outline',
            Agenda: focused ? 'calendar' : 'calendar-outline',
            Ajustes: focused ? 'settings' : 'settings-outline',
          }
          return <Ionicons name={icons[route.name]} size={22} color={color} />
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 }
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Hijos" component={HijosScreen} />
      <Tab.Screen name="Tareas" component={TareasScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="PerfilHijo" component={PerfilHijoScreen} />
        <Stack.Screen name="AgregarTarea" component={AgregarTareaScreen} />
        <Stack.Screen name="DetalleTarea" component={DetalleTareaScreen} />
        <Stack.Screen name="DetalleMateria" component={DetalleMateriaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}