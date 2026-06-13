import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './src/lib/auth';
import { registerForPushNotifications } from './src/lib/notifications';
import { Loading } from './src/components/ui';
import RootNavigator from './src/navigation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  const { hydrated, hydrate, user } = useAuth();

  // Muat sesi tersimpan saat aplikasi dibuka
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Daftarkan push token setelah login
  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {hydrated ? (
          <RootNavigator />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Loading />
          </View>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
