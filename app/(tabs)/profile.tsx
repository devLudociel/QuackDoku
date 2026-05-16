import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { getLevelProgress, useUserStore } from '../../stores/userStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { DUCK_MAP } from '../../constants/ducks';
import { DUCKS } from '../../constants/ducks';
import DuckAvatar from '../../components/ui/DuckAvatar';
import GameAsset from '../../components/ui/GameAsset';

export default function ProfileScreen() {
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
  const duck = DUCK_MAP[favoriteDuck];
  const xpProgress = getLevelProgress(level, xp);

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
            <Text style={styles.levelText}>Nivel {level} · Detective</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>Experiencia</Text>
            <Text style={styles.xpValue}>{xpProgress.xpInLevel} / {xpProgress.xpToNextLevel} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress.percent}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Casos resueltos', value: casesCompleted, icon: '📁' },
            { label: 'Casos perfectos', value: perfectCases, icon: '⭐' },
            { label: 'Racha actual', value: streakDays, icon: '🔥' },
            { label: 'Mejor tiempo', value: formatTime(bestTime), icon: '⏱' },
            { label: 'Monedas', value: coins, icon: '🪙' },
            { label: 'Pistas', value: clues, icon: '💡' },
            { label: 'Patos', value: `${unlockedDucks.length}/${DUCKS.length}`, icon: '🦆' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              {stat.label === 'Monedas' ? (
                <GameAsset name="coin" size={28} style={styles.statAsset} />
              ) : stat.label === 'Pistas' ? (
                <GameAsset name="clue" size={28} style={styles.statAsset} />
              ) : (
                <Text style={styles.statIcon}>{stat.icon}</Text>
              )}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
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
});
