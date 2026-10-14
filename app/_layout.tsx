import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SessionProvider, useSession } from '../src/hooks/useSession';
import { colors } from '../src/theme';

function RootStack() {
  const { session, loading } = useSession();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'Mi cancionero' }} />
        <Stack.Screen name="scan" options={{ title: 'Escanear', headerShown: false }} />
        <Stack.Screen name="edit-image" options={{ title: 'Ajustar imagen' }} />
        <Stack.Screen name="review" options={{ title: 'Revisar letra' }} />
        <Stack.Screen name="song/[id]" options={{ title: 'Canción' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <RootStack />
    </SessionProvider>
  );
}
