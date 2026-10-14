import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { notify } from '../src/lib/dialog';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'in' | 'up' | null>(null);

  async function signIn() {
    setBusy('in');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(null);
    if (error) notify('No se pudo iniciar sesión', error.message);
  }

  async function signUp() {
    if (password.length < 6) return notify('Contraseña muy corta', 'Usa al menos 6 caracteres.');
    setBusy('up');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(null);
    if (error) return notify('No se pudo crear la cuenta', error.message);
    if (!data.session) notify('Revisa tu correo', 'Te enviamos un enlace para confirmar la cuenta.');
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Cancionero Scan</Text>
        <Text style={styles.subtitle}>Escanea tu cancionero y guarda solo la letra, sincronizada en la nube.</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Entrar" onPress={signIn} loading={busy === 'in'} disabled={!email || !password} />
        <Button title="Crear cuenta" variant="secondary" onPress={signUp} loading={busy === 'up'} disabled={!email || !password} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 20 },
  card: { gap: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    minHeight: 50,
  },
});
