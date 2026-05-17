import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocaleSetting = 'system' | 'es' | 'en';

interface SettingsStore {
  installId: string;
  language: LocaleSetting;
  dailyReminderEnabled: boolean;
  telemetryEnabled: boolean;
  pushToken: string | null;
  setLanguage: (language: LocaleSetting) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setTelemetryEnabled: (enabled: boolean) => void;
  setPushToken: (token: string | null) => void;
}

function createInstallId(): string {
  return `install_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      installId: createInstallId(),
      language: 'system',
      dailyReminderEnabled: false,
      telemetryEnabled: true,
      pushToken: null,

      setLanguage: (language) => set({ language }),
      setDailyReminderEnabled: (enabled) => set({ dailyReminderEnabled: enabled }),
      setTelemetryEnabled: (enabled) => set({ telemetryEnabled: enabled }),
      setPushToken: (token) => set({ pushToken: token }),
    }),
    {
      name: 'quackdoku-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        installId: state.installId,
        language: state.language,
        dailyReminderEnabled: state.dailyReminderEnabled,
        telemetryEnabled: state.telemetryEnabled,
        pushToken: state.pushToken,
      }),
    },
  ),
);
