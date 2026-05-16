import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="daily" />
        <Stack.Screen name="game/[caseId]" />
        <Stack.Screen name="case/[caseId]" options={{ headerShown: true, title: 'Detalle del Caso' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
