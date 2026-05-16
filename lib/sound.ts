import { Audio } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';
import { Platform } from 'react-native';

export type SfxEvent =
  | 'place'
  | 'error'
  | 'victory'
  | 'hint'
  | 'undo'
  | 'select'
  | 'tick';

const sfxSources: Partial<Record<SfxEvent, AVPlaybackSource>> = {};
const loadedSounds: Partial<Record<SfxEvent, Audio.Sound>> = {};
let enabled = true;
let audioModeReady = false;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

/**
 * Register an SFX asset for a given event. Call this once at app boot
 * (e.g. from app/_layout.tsx) for every sound file that ships with the
 * build. Missing registrations silently no-op when playSfx is called.
 *
 * Example:
 *   registerSfx('place', require('../assets/sfx/place.mp3'));
 */
export function registerSfx(event: SfxEvent, source: AVPlaybackSource) {
  sfxSources[event] = source;
}

async function ensureAudioMode() {
  if (audioModeReady) return;
  audioModeReady = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
  } catch {
    // ignore — keeps fallback safe
  }
}

async function getSound(event: SfxEvent): Promise<Audio.Sound | null> {
  const source = sfxSources[event];
  if (!source) return null;

  const existing = loadedSounds[event];
  if (existing) return existing;

  try {
    const { sound } = await Audio.Sound.createAsync(source, { volume: 0.7 });
    loadedSounds[event] = sound;
    return sound;
  } catch {
    return null;
  }
}

export async function playSfx(event: SfxEvent): Promise<void> {
  if (!enabled) return;
  if (Platform.OS === 'web') return;

  await ensureAudioMode();
  const sound = await getSound(event);
  if (!sound) return;

  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // best-effort playback
  }
}

export async function unloadAllSfx(): Promise<void> {
  await Promise.all(
    Object.entries(loadedSounds).map(async ([key, sound]) => {
      try {
        await sound?.unloadAsync();
      } catch {
        // ignore
      }
      delete loadedSounds[key as SfxEvent];
    }),
  );
}
