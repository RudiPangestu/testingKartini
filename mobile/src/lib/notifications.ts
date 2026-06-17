import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Minta izin notifikasi, ambil Expo push token, dan daftarkan ke backend.
 * Aman dipanggil walau di emulator (akan no-op bila bukan perangkat fisik).
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    // projectId diperlukan pada build standalone (di luar Expo Go).
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig
        ?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await api.post('/auth/push-token', {
      token: tokenData.data,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
  } catch (err) {
    // Jangan hentikan aplikasi, tapi catat agar bisa di-debug. Di build
    // Android standalone, kegagalan di sini biasanya karena Firebase (FCM)
    // belum dikonfigurasi.
    // eslint-disable-next-line no-console
    console.warn('Gagal mendaftar push token:', (err as Error)?.message ?? err);
  }
}
