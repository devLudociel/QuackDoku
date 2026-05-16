import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { unloadAllSfx } from '../lib/sound';
// Once SFX files exist under assets/sfx (see assets/sfx/README.md),
// import { registerSfx } from '../lib/sound'; and uncomment below.
// import { registerSfx } from '../lib/sound';

export default function RootLayout() {
  useEffect(() => {
    // SFX registration — uncomment when assets/sfx/*.mp3 files exist.
    // registerSfx('place', require('../assets/sfx/place.mp3'));
    // registerSfx('error', require('../assets/sfx/error.mp3'));
    // registerSfx('victory', require('../assets/sfx/victory.mp3'));
    // registerSfx('hint', require('../assets/sfx/hint.mp3'));
    // registerSfx('undo', require('../assets/sfx/undo.mp3'));
    // registerSfx('select', require('../assets/sfx/select.mp3'));
    // registerSfx('tick', require('../assets/sfx/tick.mp3'));

    return () => {
      unloadAllSfx();
    };
  }, []);

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
