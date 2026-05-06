import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { getLevelProgress, useUserStore } from '../../stores/userStore';
import { ALL_CASES } from '../../constants/cases';
import GameAsset from '../../components/ui/GameAsset';

export default function HomeScreen() {
  const { username, level, xp, coins, streakDays, casesCompleted } =
    useUserStore();

  const xpProgress = getLevelProgress(level, xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, detective! 🦆</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.coinsChip}>
              <GameAsset name="coin" size={22} />
              <Text style={styles.coinAmount}>{coins}</Text>
            </View>
          </View>
        </View>

        {/* Level + XP bar */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelBadge}>Nv. {level}</Text>
            <Text style={styles.xpText}>{xpProgress.xpInLevel} / {xpProgress.xpToNextLevel} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress.percent}%` }]} />
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Casos', value: casesCompleted, icon: '📁' },
            { label: 'Racha', value: streakDays, icon: '🔥' },
            { label: 'Monedas', value: coins, icon: '🪙' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              {stat.label === 'Monedas' ? (
                <GameAsset name="coin" size={26} style={styles.statAsset} />
              ) : (
                <Text style={styles.statIcon}>{stat.icon}</Text>
              )}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Hero CTA */}
        <Pressable
          style={styles.heroCard}
          onPress={() => router.push('/(tabs)/cases')}
        >
          <View style={styles.heroContent}>
            <GameAsset name="clue" size={46} />
            <View>
              <Text style={styles.heroTitle}>Nueva Partida</Text>
              <Text style={styles.heroSubtitle}>
                {ALL_CASES.length} caso{ALL_CASES.length !== 1 ? 's' : ''} disponible{ALL_CASES.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.heroArrow}>›</Text>
        </Pressable>

        {/* Daily case */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Caso Diario</Text>
        </View>
        <Pressable
          style={styles.dailyCard}
          onPress={() => router.push('/case/case_001')}
        >
          <View style={styles.dailyLeft}>
            <Text style={styles.dailyEmoji}>🏰</Text>
            <View>
              <Text style={styles.dailyTitle}>{ALL_CASES[0].title}</Text>
              <Text style={styles.dailyDifficulty}>
                {'⭐'.repeat(ALL_CASES[0].difficulty)} · {ALL_CASES[0].location}
              </Text>
            </View>
          </View>
          <View style={styles.dailyReward}>
            <Text style={styles.rewardText}>+150</Text>
            <GameAsset name="coin" size={18} />
          </View>
        </Pressable>

        {/* Logo footer */}
        <View style={styles.footer}>
          <GameAsset name="logo" width={220} height={82} style={styles.footerLogo} />
          <Text style={styles.footerSub}>Sudoku × Misterio × Patos</Text>
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
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Fonts.body,
    color: Colors.gray,
  },
  username: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  coinsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  coinAmount: {
    fontWeight: '700',
    color: Colors.blackPremium,
    fontSize: Fonts.body,
  },
  levelCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  levelBadge: {
    fontWeight: '700',
    fontSize: Fonts.body,
    color: Colors.blackPremium,
  },
  xpText: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grayLight,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.yellow,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statAsset: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: Fonts.h3,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  statLabel: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    ...Shadow.button,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroTitle: {
    fontSize: Fonts.h3,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  heroSubtitle: {
    fontSize: Fonts.small,
    color: Colors.blackPremium,
    opacity: 0.7,
  },
  heroArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.blackPremium,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Fonts.h3,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  dailyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.yellow,
    ...Shadow.card,
  },
  dailyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  dailyEmoji: {
    fontSize: 32,
  },
  dailyTitle: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  dailyDifficulty: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  dailyReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  rewardText: {
    fontSize: Fonts.small,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerLogo: {
    marginBottom: 2,
  },
  footerSub: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    marginTop: 4,
  },
});
