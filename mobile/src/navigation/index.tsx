import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../lib/auth';
import { colors } from '../lib/theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportsScreen from '../screens/ReportsScreen';
import EventsScreen from '../screens/EventsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GuruAttendanceScreen from '../screens/GuruAttendanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function icon(emoji: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 18, color }}>{emoji}</Text>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.brand },
  headerTintColor: '#fff',
  tabBarActiveTintColor: colors.brand,
};

function FamilyTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{ tabBarIcon: icon('🏠') }}
      />
      <Tab.Screen
        name="Laporan"
        component={ReportsScreen}
        options={{ tabBarIcon: icon('📊') }}
      />
      <Tab.Screen
        name="Kegiatan"
        component={EventsScreen}
        options={{ tabBarIcon: icon('📅') }}
      />
      <Tab.Screen
        name="Notifikasi"
        component={NotificationsScreen}
        options={{ tabBarIcon: icon('🔔') }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: icon('👤') }}
      />
    </Tab.Navigator>
  );
}

function GuruTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Presensi"
        component={GuruAttendanceScreen}
        options={{ tabBarIcon: icon('✅') }}
      />
      <Tab.Screen
        name="Kegiatan"
        component={EventsScreen}
        options={{ tabBarIcon: icon('📅') }}
      />
      <Tab.Screen
        name="Notifikasi"
        component={NotificationsScreen}
        options={{ tabBarIcon: icon('🔔') }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: icon('👤') }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Kegiatan"
        component={EventsScreen}
        options={{ tabBarIcon: icon('📅') }}
      />
      <Tab.Screen
        name="Notifikasi"
        component={NotificationsScreen}
        options={{ tabBarIcon: icon('🔔') }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: icon('👤') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const user = useAuth((s) => s.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                headerShown: true,
                title: 'Daftar',
                headerStyle: { backgroundColor: colors.brand },
                headerTintColor: '#fff',
              }}
            />
          </>
        ) : user.role === 'GURU' ? (
          <Stack.Screen name="GuruRoot" component={GuruTabs} />
        ) : user.role === 'ADMIN' ? (
          <Stack.Screen name="AdminRoot" component={AdminTabs} />
        ) : (
          <Stack.Screen name="FamilyRoot" component={FamilyTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
