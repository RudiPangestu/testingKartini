import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, apiError } from '../lib/api';
import { Button } from '../components/ui';
import { colors } from '../lib/theme';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { fullName, email, phone, password });
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.logo}>Cek email Anda</Text>
        <Text style={styles.sub}>
          Tautan verifikasi telah dikirim ke {email}. Klik tautan itu untuk
          mengaktifkan akun, lalu masuk. (Cek folder Spam bila perlu.)
        </Text>
        <View style={{ height: 16 }} />
        <Button title="Kembali ke Login" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>Daftar Orang Tua / Wali</Text>
        <Text style={styles.sub}>Buat akun untuk memantau kehadiran ananda</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="email@contoh.com"
        />
        <Text style={styles.label}>No. HP (opsional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="0812xxxxxxx"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Minimal 6 karakter"
        />
        <View style={{ height: 16 }} />
        <Button
          title={loading ? 'Memproses…' : 'Daftar'}
          onPress={onRegister}
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  inner: { padding: 24, paddingTop: 48 },
  emoji: { fontSize: 48, marginBottom: 8 },
  logo: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: {
    color: '#ffffffcc',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 6,
  },
  label: { color: '#fff', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  error: {
    backgroundColor: '#ffffff',
    color: colors.red,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
});
