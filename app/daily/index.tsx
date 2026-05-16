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
import { formatDailyTime, getDailyCaseForDate } from '../../lib/daily';
import { useCountdownToMidnight } from '../../hooks/useCountdownToMidnight';
import { useDailyStore } from '../../stores/dailyStore';
import Button from '../../components/ui/Button';
import GameAsset from '../../components/ui/GameAsset';
import DuckAvatar from '../../components/ui/DuckAvatar';
import { DUCK_MAP } from '../../constants/ducks';

function splitCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

export default function DailyCaseScreen() {
  const daily = getDailyCaseForDate();
  const secondsLeft = useCountdownToMidnight();
  const completion = useDailyStore((state) => state.resultsByDate[daily.date]);
  const getLeaderboardForDate = useDailyStore((state) => state.getLeaderboardForDate);
  const leaderboard = getLeaderboardForDate(daily.date).slice(0, 3);
  const countdown = splitCountdown(secondsLeft);
  const heroDuck = DUCK_MAP.duck_tophat;

  const startDailyCase = () => {
    router.push(`/game/${daily.case.case_id}?daily=1`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Caso del Dia</Text>
          <Text style={styles.trophy}>🏆</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>HOY · #{daily.dayNumber}</Text>
          </View>
          <View style={styles.heroDuckWrap}>
            <DuckAvatar duck={heroDuck} size={102} />
          </View>
          <Text style={styles.caseTitle}>{daily.case.title}</Text>
          <Text style={styles.caseStars}>{'⭐'.repeat(Math.min(3, daily.case.difficulty))}</Text>
        </View>

        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Nuevo caso en:</Text>
          <View style={styles.countdownRow}>
            {[
              { label: 'HS', value: countdown.hours },
              { label: 'MS', value: countdown.minutes },
              { label: 'SS', value: countdown.seconds },
            ].map((item) => (
              <View key={item.label} style={styles.timeBox}>
                <Text style={styles.timeValue}>{item.value.toString().padStart(2, '0')}</Text>
                <Text style={styles.timeLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detectivesCard}>
          <Text style={styles.cardTitle}>Detectives de hoy</Text>
          <View style={styles.detectiveStats}>
            <View style={styles.detectiveStat}>
              <Text style={styles.detectiveIcon}>🦆</Text>
              <Text style={styles.detectiveValue}>1.247</Text>
              <Text style={styles.detectiveLabel}>jugaron hoy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.detectiveStat}>
              <Text style={styles.detectiveIcon}>⭐</Text>
              <Text style={styles.detectiveValue}>68%</Text>
              <Text style={styles.detectiveLabel}>3 estrellas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.detectiveStat}>
              <Text style={styles.detectiveIcon}>⏱</Text>
              <Text style={styles.detectiveValue}>7:32</Text>
              <Text style={styles.detectiveLabel}>tiempo medio</Text>
            </View>
          </View>
        </View>

        <View style={styles.topDetectivesCard}>
          <View style={styles.topDetectivesHeader}>
            <Text style={styles.cardTitle}>Top detectives hoy</Text>
            <Text style={styles.viewAll}>Ver todos →</Text>
          </View>
          {leaderboard.map((entry) => (
            <View key={`${entry.rank}-${entry.username}`} style={styles.detectiveRow}>
              <Text style={styles.rankMedal}>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</Text>
              <DuckAvatar duck={entry.rank === 2 ? DUCK_MAP.duck_plum : heroDuck} size={26} />
              <Text style={styles.detectiveName}>{entry.username}</Text>
              <Text style={styles.detectiveTime}>{formatDailyTime(entry.timeSeconds)}</Text>
              <Text style={styles.detectiveStars}>{'⭐'.repeat(entry.stars)}</Text>
            </View>
          ))}
        </View>

        {completion ? (
          <View style={styles.completedBox}>
            <Text style={styles.completedTitle}>Caso resuelto hoy</Text>
            <Text style={styles.completedText}>
              {'⭐'.repeat(completion.stars)}{'☆'.repeat(3 - completion.stars)} · {formatDailyTime(completion.timeSeconds)} · {completion.errors} error(es)
            </Text>
            <Button label="Ver resultado y ranking" onPress={() => router.push('/daily/result')} fullWidth />
          </View>
        ) : (
          <Button label="Investigar el caso de hoy →" onPress={startDailyCase} fullWidth style={styles.startButton} />
        )}

        <Pressable style={styles.secondaryCard} onPress={() => router.push('/(tabs)/cases')}>
          <Text style={styles.secondaryTitle}>Casos normales</Text>
          <Text style={styles.secondaryText}>Juega el catalogo sin afectar tu resultado diario.</Text>
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
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: Colors.blackPremium,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: Fonts.body,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  trophy: {
    width: 36,
    textAlign: 'center',
    fontSize: 18,
  },
  heroCard: {
    minHeight: 188,
    borderRadius: Radius.card,
    backgroundColor: Colors.navy,
    padding: Spacing.md,
    overflow: 'hidden',
    borderTopWidth: 3,
    borderTopColor: Colors.yellow,
    ...Shadow.darkCard,
  },
  dayPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  dayPillText: {
    fontSize: 10,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  heroDuckWrap: {
    alignItems: 'center',
    marginTop: -2,
    marginBottom: Spacing.sm,
  },
  caseTitle: {
    color: Colors.white,
    fontSize: Fonts.h3,
    fontWeight: '900',
    lineHeight: 24,
  },
  caseStars: {
    color: Colors.yellow,
    fontSize: Fonts.small,
    fontWeight: '900',
    marginTop: 2,
  },
  countdownCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  countdownLabel: {
    textAlign: 'center',
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '800',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  timeBox: {
    flex: 1,
    borderRadius: Radius.badge,
    backgroundColor: '#F1F3FF',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 30,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  timeLabel: {
    fontSize: 10,
    color: '#6C63FF',
    fontWeight: '900',
  },
  detectivesCard: {
    backgroundColor: '#FFFDF2',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.yellow,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Fonts.small,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  detectiveStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectiveStat: {
    flex: 1,
    alignItems: 'center',
  },
  detectiveIcon: {
    fontSize: Fonts.body,
  },
  detectiveValue: {
    fontSize: Fonts.h3,
    color: Colors.blackPremium,
    fontWeight: '900',
    marginTop: 2,
  },
  detectiveLabel: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: Colors.grayLight,
  },
  topDetectivesCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  topDetectivesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    color: Colors.yellowDark,
    fontSize: Fonts.xs,
    fontWeight: '900',
  },
  detectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 3,
  },
  rankMedal: {
    width: 22,
    fontSize: 14,
  },
  detectiveName: {
    flex: 1,
    color: Colors.blackPremium,
    fontSize: Fonts.small,
    fontWeight: '900',
  },
  detectiveTime: {
    color: Colors.blackPremium,
    fontSize: Fonts.small,
    fontWeight: '900',
  },
  detectiveStars: {
    color: Colors.yellow,
    fontSize: 10,
    minWidth: 38,
    textAlign: 'right',
  },
  completedBox: {
    borderRadius: Radius.card,
    backgroundColor: Colors.yellowSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  completedTitle: {
    fontSize: Fonts.body,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  completedText: {
    fontSize: Fonts.small,
    color: Colors.gray,
    fontWeight: '700',
  },
  startButton: {
    marginTop: 2,
  },
  secondaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: 4,
    ...Shadow.card,
  },
  secondaryTitle: {
    fontSize: Fonts.body,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  secondaryText: {
    fontSize: Fonts.small,
    color: Colors.gray,
    fontWeight: '700',
  },
});
