import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/theme';
import { formatDailyTime, getDailyCaseForDate } from '../../lib/daily';
import { useDailyStore } from '../../stores/dailyStore';
import DailyShareCard from '../../components/daily/DailyShareCard';
import Button from '../../components/ui/Button';
import DuckAvatar from '../../components/ui/DuckAvatar';
import { DUCK_MAP } from '../../constants/ducks';

export default function DailyResultScreen() {
  const daily = getDailyCaseForDate();
  const completion = useDailyStore((state) => state.resultsByDate[daily.date]);
  const getLeaderboardForDate = useDailyStore((state) => state.getLeaderboardForDate);
  const leaderboard = getLeaderboardForDate(daily.date);

  if (!completion) {
    return (
      <SafeAreaView style={styles.emptySafe}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Todavia no resolviste el caso diario</Text>
          <Text style={styles.emptyText}>Completa el tablero de hoy para desbloquear el resultado compartible.</Text>
          <Button label="Ir al caso diario" onPress={() => router.replace('/daily')} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => `${item.rank}-${item.username}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.replace('/daily')} style={styles.backButton}>
                <Text style={styles.backText}>←</Text>
              </Pressable>
              <Text style={styles.screenTitle}>Resultado diario</Text>
              <View style={styles.backButton} />
            </View>

            <DailyShareCard
              stars={completion.stars}
              timeSeconds={completion.timeSeconds}
              errors={completion.errors}
              shareGrid={completion.shareGrid}
              dayNumber={completion.dayNumber}
              caseName={completion.caseName}
            />

            <View style={styles.recordStrip}>
              <Text style={styles.recordText}>Mejor tiempo personal</Text>
              <Text style={styles.recordValue}>¡Nuevo record! →</Text>
            </View>

            <View style={styles.leaderboardHeader}>
              <Text style={styles.sectionTitle}>Ranking de hoy</Text>
              <Text style={styles.sectionSub}>Top detectives del Caso #{daily.dayNumber}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.rankRow, item.isUser && styles.userRankRow]}>
            <Text style={[styles.rankNumber, item.isUser && styles.userText]}>{item.rank}</Text>
            <DuckAvatar duck={item.rank % 2 === 0 ? DUCK_MAP.duck_plum : DUCK_MAP.duck_tophat} size={32} />
            <View style={styles.rankInfo}>
              <Text style={[styles.rankName, item.isUser && styles.userText]}>{item.username}</Text>
              <Text style={[styles.rankMeta, item.isUser && styles.userMutedText]}>
                {'⭐'.repeat(item.stars)}{'☆'.repeat(3 - item.stars)}
              </Text>
            </View>
            <Text style={[styles.rankTime, item.isUser && styles.userText]}>{formatDailyTime(item.timeSeconds)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <Button
              label="Siguiente caso →"
              onPress={() => router.replace('/(tabs)/cases')}
              fullWidth
            />
            <Button
              label="⌂ Inicio"
              variant="secondary"
              onPress={() => router.replace('/(tabs)')}
              fullWidth
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  emptySafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  headerContent: {
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
    color: Colors.yellow,
    fontSize: 22,
    fontWeight: '900',
  },
  screenTitle: {
    color: Colors.white,
    fontSize: Fonts.body,
    fontWeight: '900',
  },
  recordStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.successSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recordText: {
    color: Colors.gray,
    fontSize: Fonts.xs,
    fontWeight: '800',
  },
  recordValue: {
    color: Colors.success,
    fontSize: Fonts.small,
    fontWeight: '900',
  },
  leaderboardHeader: {
    gap: 2,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Fonts.h3,
    color: Colors.white,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: Fonts.small,
    color: Colors.whiteMuted,
    fontWeight: '700',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Shadow.darkCard,
  },
  userRankRow: {
    backgroundColor: Colors.yellow,
  },
  rankNumber: {
    width: 24,
    fontSize: Fonts.body,
    color: Colors.white,
    fontWeight: '900',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: Fonts.body,
    color: Colors.white,
    fontWeight: '900',
  },
  rankMeta: {
    fontSize: Fonts.xs,
    color: Colors.whiteMuted,
    marginTop: 2,
    fontWeight: '800',
  },
  rankTime: {
    fontSize: Fonts.body,
    color: Colors.yellow,
    fontWeight: '900',
  },
  userText: {
    color: Colors.blackPremium,
  },
  userMutedText: {
    color: Colors.blackPremium,
    opacity: 0.65,
  },
  footerActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: Colors.navyMuted,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryButtonText: {
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Fonts.h3,
    color: Colors.blackPremium,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Fonts.small,
    color: Colors.gray,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
});
