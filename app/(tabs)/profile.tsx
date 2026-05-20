import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { getLevelProgress, useUserStore } from '../../stores/userStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { DUCK_MAP } from '../../constants/ducks';
import { DUCKS } from '../../constants/ducks';
import DuckAvatar from '../../components/ui/DuckAvatar';
import GameAsset from '../../components/ui/GameAsset';
import { flushTelemetry, setTelemetryEnabled as setTelemetryRuntimeEnabled, track, trackScreen } from '../../lib/telemetry';
import { useI18n } from '../../lib/i18n';
import { cancelDailyReminder, registerForPushNotifications, scheduleDailyReminder } from '../../lib/notifications';
import { useSettingsStore } from '../../stores/settingsStore';

export default function ProfileScreen() {
  const { language, setLanguage, t } = useI18n();
  const {
    username,
    level,
    xp,
    coins,
    clues,
    streakDays,
    casesCompleted,
    perfectCases,
    bestTime,
  } = useUserStore();

  const { favoriteDuck, unlockedDucks } = useCollectionStore();
  const dailyReminderEnabled = useSettingsStore((state) => state.dailyReminderEnabled);
  const telemetryEnabled = useSettingsStore((state) => state.telemetryEnabled);
  const setDailyReminderEnabled = useSettingsStore((state) => state.setDailyReminderEnabled);
  const setTelemetryEnabled = useSettingsStore((state) => state.setTelemetryEnabled);
  const setPushToken = useSettingsStore((state) => state.setPushToken);
  const duck = DUCK_MAP[favoriteDuck];
  const xpProgress = getLevelProgress(level, xp);
  const resetTutorial = useUserStore((state) => state.resetTutorial);

  useFocusEffect(
    useCallback(() => {
      const properties = {
        level,
        cases_completed: casesCompleted,
        perfect_cases: perfectCases,
        streak: streakDays,
        coins,
        clues,
        unlocked_ducks: unlockedDucks.length,
        total_ducks: DUCKS.length,
      };
      trackScreen('profile', properties);
      track('profile_opened', properties);
    }, [casesCompleted, clues, coins, level, perfectCases, streakDays, unlockedDucks.length])
  );

  const handleResetTutorial = () => {
    Alert.alert(
      t('profile.repeatTutorialTitle'),
      t('profile.repeatTutorialBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Si',
          onPress: () => {
            resetTutorial();
            Alert.alert(t('common.ready'), t('profile.repeatTutorialDone'));
          },
        },
      ],
    );
  };

  const handleDailyReminderToggle = async (enabled: boolean) => {
    if (!enabled) {
      await cancelDailyReminder();
      setDailyReminderEnabled(false);
      Alert.alert(t('common.ready'), t('profile.dailyReminderOff'));
      return;
    }

    const token = await registerForPushNotifications();
    setPushToken(token);
    const scheduled = await scheduleDailyReminder();
    setDailyReminderEnabled(scheduled);
    Alert.alert(
      t('common.ready'),
      scheduled ? t('profile.dailyReminderOn') : t('profile.dailyReminderOff')
    );
  };

  const handleTelemetryToggle = (enabled: boolean) => {
    if (enabled) {
      setTelemetryEnabled(true);
      setTelemetryRuntimeEnabled(true);
      track('telemetry_opt_in');
      return;
    }

    track('telemetry_opt_out');
    void flushTelemetry().finally(() => {
      setTelemetryRuntimeEnabled(false);
      setTelemetryEnabled(false);
    });
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarCircle}>
            <DuckAvatar duck={duck} size={82} />
          </View>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{t('profile.levelDetective', { level })}</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>{t('profile.experience')}</Text>
            <Text style={styles.xpValue}>{xpProgress.xpInLevel} / {xpProgress.xpToNextLevel} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress.percent}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
            {[
            { key: 'cases', label: t('profile.casesSolved'), value: casesCompleted, icon: '📁' },
            { key: 'perfect', label: t('profile.perfectCases'), value: perfectCases, icon: '⭐' },
            { key: 'streak', label: t('profile.currentStreak'), value: streakDays, icon: '🔥' },
            { key: 'time', label: t('profile.bestTime'), value: formatTime(bestTime), icon: '⏱' },
            { key: 'coins', label: t('profile.coins'), value: coins, icon: '🪙' },
            { key: 'clues', label: t('profile.clues'), value: clues, icon: '💡' },
            { key: 'ducks', label: t('profile.ducks'), value: `${unlockedDucks.length}/${DUCKS.length}`, icon: '🦆' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              {stat.key === 'coins' ? (
                <GameAsset name="coin" size={28} style={styles.statAsset} />
              ) : stat.key === 'clues' ? (
                <GameAsset name="clue" size={28} style={styles.statAsset} />
              ) : (
                <Text style={styles.statIcon}>{stat.icon}</Text>
              )}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{t('profile.settings')}</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{t('common.language')}</Text>
              <Text style={styles.settingSub}>{language.toUpperCase()}</Text>
            </View>
            <View style={styles.segmented}>
              {(['es', 'en'] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setLanguage(item)}
                  style={[styles.segment, language === item && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, language === item && styles.segmentTextActive]}>
                    {item === 'es' ? t('common.spanish') : t('common.english')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{t('profile.dailyReminder')}</Text>
              <Text style={styles.settingSub}>
                {dailyReminderEnabled ? t('profile.dailyReminderEnabled') : t('profile.dailyReminderDisabled')}
              </Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={handleDailyReminderToggle}
              trackColor={{ false: Colors.grayLight, true: Colors.yellowSoft }}
              thumbColor={dailyReminderEnabled ? Colors.yellow : Colors.grayMuted}
            />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{t('profile.analytics')}</Text>
              <Text style={styles.settingSub}>
                {telemetryEnabled ? t('profile.analyticsEnabled') : t('profile.analyticsDisabled')}
              </Text>
            </View>
            <Switch
              value={telemetryEnabled}
              onValueChange={handleTelemetryToggle}
              trackColor={{ false: Colors.grayLight, true: Colors.yellowSoft }}
              thumbColor={telemetryEnabled ? Colors.yellow : Colors.grayMuted}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleResetTutorial}
          style={({ pressed }) => [styles.tutorialBtn, pressed && styles.tutorialBtnPressed]}
        >
          <Text style={styles.tutorialBtnText}>{t('profile.repeatTutorial')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.yellowSoft,
    borderWidth: 3,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  username: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  levelBadge: {
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  levelText: {
    fontWeight: '700',
    color: Colors.blackPremium,
    fontSize: Fonts.small,
  },
  xpCard: {
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    ...Shadow.card,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  xpLabel: {
    fontWeight: '600',
    color: Colors.blackPremium,
  },
  xpValue: {
    color: Colors.gray,
    fontSize: Fonts.small,
  },
  xpBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.grayLight,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.yellow,
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  statCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statAsset: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: Fonts.body,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  statLabel: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 2,
  },
  settingsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.card,
  },
  settingsTitle: {
    fontSize: Fonts.body,
    fontWeight: '900',
    color: Colors.blackPremium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: Fonts.small,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  settingSub: {
    marginTop: 2,
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '700',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.badge,
    padding: 3,
  },
  segment: {
    minWidth: 42,
    paddingVertical: 7,
    borderRadius: Radius.badge,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.yellow,
  },
  segmentText: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: Colors.blackPremium,
  },
  tutorialBtn: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  tutorialBtnPressed: {
    opacity: 0.75,
  },
  tutorialBtnText: {
    color: Colors.gray,
    fontSize: Fonts.small,
    fontWeight: '600',
  },
});
