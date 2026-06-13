import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, apiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui';
import { colors } from '../lib/theme';
import type { AuthResponse } from '../lib/types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);

  async function onLogin() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      await setAuth(res.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>SIPRES Kartini</Text>
        <Text style={styles.sub}>Masuk untuk melihat kehadiran ananda</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="email@contoh.com"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={{ height: 16 }} />
        <Button
          title={loading ? 'Memproses…' : 'Masuk'}
          onPress={onLogin}
          disabled={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: {
    color: '#ffffffcc',
    textAlign: 'center',
    marginBottom: 28,
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
