import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Button, Card } from '../components/ui';
import { colors } from '../lib/theme';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  GURU: 'Guru',
  ORTU: 'Orang Tua / Wali',
  MURID: 'Murid',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    const refreshToken = useAuth.getState().refreshToken;
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    await logout();
  }

  return (
    <View style={styles.screen}>
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.role}>{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Text>
        <View style={styles.divider} />
        <Row label="Email" value={user?.email ?? '—'} />
        <Row label="Telepon" value={user?.phone ?? '—'} />
      </Card>
      <Button title="Keluar" variant="danger" onPress={handleLogout} />
      <Text style={styles.footer}>SIPRES Kartini · v0.1.0</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  role: { color: colors.brand, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  footer: { textAlign: 'center', color: colors.muted, marginTop: 24, fontSize: 12 },
});
