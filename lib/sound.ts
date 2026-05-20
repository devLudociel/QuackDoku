import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioSource } from 'expo-audio';
import { Platform } from 'react-native';

export type SfxEvent =
  | 'place'
  | 'error'
  | 'victory'
  | 'hint'
  | 'undo'
  | 'select'
  | 'tick';

const sfxSources: Partial<Record<SfxEvent, AudioSource>> = {};
const loadedPlayers: Partial<Record<SfxEvent, AudioPlayer>> = {};
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
export function registerSfx(event: SfxEvent, source: AudioSource) {
  sfxSources[event] = source;
}

async function ensureAudioMode() {
  if (audioModeReady) return;
  audioModeReady = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    // ignore; keeps fallback safe
  }
}

async function getPlayer(event: SfxEvent): Promise<AudioPlayer | null> {
  const source = sfxSources[event];
  if (!source) return null;

  const existing = loadedPlayers[event];
  if (existing) return existing;

  try {
    const player = createAudioPlayer(source, {
      downloadFirst: true,
      updateInterval: 1000,
    });
    player.volume = 0.7;
    loadedPlayers[event] = player;
    return player;
  } catch {
    return null;
  }
}

export async function playSfx(event: SfxEvent): Promise<void> {
  if (!enabled) return;
  if (Platform.OS === 'web') return;

  await ensureAudioMode();
  const player = await getPlayer(event);
  if (!player) return;

  try {
    await player.seekTo(0);
    player.play();
  } catch {
    // best-effort playback
  }
}

export async function unloadAllSfx(): Promise<void> {
  await Promise.all(
    Object.entries(loadedPlayers).map(async ([key, player]) => {
      try {
        player?.remove();
      } catch {
        // ignore
      }
      delete loadedPlayers[key as SfxEvent];
    }),
  );
}
