import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/theme';
import { getLevelProgress, useUserStore } from '../../stores/userStore';
import { ALL_CASES } from '../../constants/cases';
import { formatCountdown, getDailyCaseForDate } from '../../lib/daily';
import { useCountdownToMidnight } from '../../hooks/useCountdownToMidnight';
import GameAsset from '../../components/ui/GameAsset';
import DuckAvatar from '../../components/ui/DuckAvatar';
import { DUCK_MAP } from '../../constants/ducks';

const ACTIVE_CASES = [
  { title: 'El Informador', subtitle: 'Club Nocturno Migra', status: 'Jugar' },
  { title: 'Plumas de Seda', subtitle: 'Hotel Plumaza', status: 'Resuelto' },
  { title: 'La Herencia', subtitle: 'Mansión Quackwell', status: 'Jugar' },
];

export default function HomeScreen() {
  const { username, level, xp, coins, streakDays, casesCompleted, bestTime } = useUserStore();
  const xpProgress = getLevelProgress(level, xp);
  const daily = getDailyCaseForDate();
  const secondsLeft = useCountdownToMidnight();
  const heroDuck = DUCK_MAP.duck_tophat;

  const formatBestTime = (seconds: number | null) => {
    if (!seconds) return '3:12';
    const mins = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${mins}:${rest.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>BUENOS DIAS</Text>
            <Text style={styles.username}>{username}_Mx 🦆</Text>
          </View>
          <View style={styles.avatarWrap}>
            <DuckAvatar duck={heroDuck} size={44} />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>3</Text>
            </View>
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelText}>Nivel {level}</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress.percent}%` }]} />
          </View>
          <Text style={styles.xpText}>{xpProgress.xpInLevel} / {xpProgress.xpToNextLevel} XP</Text>
        </View>

        <Pressable style={styles.dailyHero} onPress={() => router.push('/daily')}>
          <View style={styles.heroCopy}>
            <Text style={styles.todayPill}>HOY</Text>
            <Text style={styles.dailyTitle}>{daily.case.title}</Text>
            <Text style={styles.dailyMeta}>
              {'⭐'.repeat(Math.min(3, daily.case.difficulty))} · {daily.dayNumber.toLocaleString()} jugaron
            </Text>
            <View style={styles.heroButton}>
              <Text style={styles.heroButtonText}>¡Investigar hoy! 🔍</Text>
            </View>
          </View>
          <View style={styles.heroDuck}>
            <DuckAvatar duck={heroDuck} size={94} />
          </View>
          <Text style={styles.heroTimer}>⏱ {formatCountdown(secondsLeft)}</Text>
        </Pressable>

        <Pressable style={styles.leagueCard}>
          <View style={styles.medalCircle}>
            <Text style={styles.medalText}>🥇</Text>
          </View>
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueTitle}>Liga Oro · Posición 7/30</Text>
            <Text style={styles.leagueSub}>3 días para el cierre</Text>
            <View style={styles.leagueTrack}>
              <View style={styles.leagueFill} />
            </View>
            <Text style={styles.leagueFoot}>Posición actual: 7</Text>
          </View>
          <View style={styles.leagueReward}>
            <Text style={styles.leagueRewardText}>+200</Text>
            <GameAsset name="coin" size={14} />
            <Text style={styles.leagueRewardSub}>si top 10</Text>
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          {[
            { icon: '◈', value: String(casesCompleted || 12), label: 'Casos' },
            { icon: '🔥', value: String(streakDays || 7), label: 'Racha' },
            { icon: '🪙', value: String(coins), label: 'Monedas' },
            { icon: '🏆', value: `#${daily.dayNumber}`, label: 'Liga' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expedientes activos</Text>
        </View>

        <View style={styles.caseList}>
          {ACTIVE_CASES.map((item, index) => (
            <Pressable
              key={item.title}
              style={styles.caseRow}
              onPress={() => router.push(index === 0 ? `/case/${ALL_CASES[0].case_id}` : '/(tabs)/cases')}
            >
              <View style={styles.caseThumb}>
                <DuckAvatar duck={index === 1 ? DUCK_MAP.duck_plum : heroDuck} size={34} />
              </View>
              <View style={styles.caseText}>
                <Text style={styles.caseTitle}>{item.title}</Text>
                <Text style={styles.caseSub}>{item.subtitle}</Text>
              </View>
              <View style={[styles.caseStatus, item.status === 'Resuelto' && styles.caseStatusDone]}>
                <Text style={[styles.caseStatusText, item.status === 'Resuelto' && styles.caseStatusDoneText]}>
                  {item.status === 'Resuelto' ? '✓ Resuelto' : 'Jugar →'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerStats}>
          <Text style={styles.footerText}>Récord personal: {formatBestTime(bestTime)}</Text>
          <Text style={styles.footerText}>Sudoku × Misterio × Patos</Text>
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
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.gray,
    letterSpacing: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.blackPremium,
    marginTop: 3,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  avatarBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelText: {
    fontSize: Fonts.xs,
    color: '#6C63FF',
    fontWeight: '800',
  },
  xpTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grayLight,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.yellow,
  },
  xpText: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '800',
  },
  dailyHero: {
    minHeight: 150,
    borderRadius: Radius.card,
    backgroundColor: Colors.navy,
    padding: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    borderTopWidth: 3,
    borderTopColor: Colors.yellow,
    ...Shadow.darkCard,
  },
  heroCopy: {
    width: '70%',
    zIndex: 2,
    gap: 6,
  },
  todayPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    color: Colors.blackPremium,
    fontSize: 10,
    fontWeight: '900',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dailyTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  dailyMeta: {
    color: Colors.whiteMuted,
    fontSize: Fonts.xs,
    fontWeight: '700',
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    marginTop: 4,
    ...Shadow.button,
  },
  heroButtonText: {
    color: Colors.blackPremium,
    fontWeight: '900',
    fontSize: Fonts.small,
  },
  heroDuck: {
    position: 'absolute',
    right: -8,
    bottom: -14,
    opacity: 0.62,
  },
  heroTimer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.md,
    color: Colors.whiteMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  medalCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: 24,
  },
  leagueInfo: {
    flex: 1,
    gap: 3,
  },
  leagueTitle: {
    color: Colors.blackPremium,
    fontSize: Fonts.body,
    fontWeight: '900',
  },
  leagueSub: {
    color: Colors.gray,
    fontSize: Fonts.xs,
    fontWeight: '700',
  },
  leagueTrack: {
    height: 5,
    backgroundColor: Colors.grayLight,
    borderRadius: 3,
    marginTop: 5,
    overflow: 'hidden',
  },
  leagueFill: {
    width: '63%',
    height: '100%',
    backgroundColor: '#7C6DFF',
  },
  leagueFoot: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: '700',
  },
  leagueReward: {
    alignItems: 'center',
    gap: 1,
  },
  leagueRewardText: {
    color: Colors.warning,
    fontSize: Fonts.small,
    fontWeight: '900',
  },
  leagueRewardSub: {
    color: Colors.gray,
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 68,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    ...Shadow.card,
  },
  statIcon: {
    fontSize: 15,
  },
  statValue: {
    fontSize: Fonts.body,
    color: Colors.blackPremium,
    fontWeight: '900',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Fonts.body,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  caseList: {
    gap: Spacing.sm,
  },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 64,
    ...Shadow.card,
  },
  caseThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseText: {
    flex: 1,
  },
  caseTitle: {
    fontSize: Fonts.small,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  caseSub: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '700',
    marginTop: 2,
  },
  caseStatus: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  caseStatusDone: {
    backgroundColor: Colors.successSoft,
  },
  caseStatusText: {
    fontSize: 11,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  caseStatusDoneText: {
    color: Colors.success,
  },
  footerStats: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '700',
  },
});
