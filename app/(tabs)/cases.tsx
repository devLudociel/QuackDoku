import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { ALL_CASES, GameCase } from '../../constants/cases';
import GameAsset from '../../components/ui/GameAsset';
import { useI18n } from '../../lib/i18n';

function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <Text>
      {Array.from({ length: 5 }, (_, i) => (i < difficulty ? '⭐' : '☆')).join('')}
    </Text>
  );
}

function CaseCard({ item }: { item: GameCase }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/case/${item.case_id}`)}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.caseEmoji}>🏰</Text>
        <View style={styles.caseInfo}>
          <Text style={styles.caseTitle}>{item.title}</Text>
          <Text style={styles.caseSub}>{item.location}</Text>
          <DifficultyStars difficulty={item.difficulty} />
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.rewardChip}>
          <Text style={styles.rewardText}>+{item.rewards.coins}</Text>
          <GameAsset name="coin" size={18} />
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

export default function CasesScreen() {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cases.title')}</Text>
        <Text style={styles.subtitle}>{t('cases.available', { count: ALL_CASES.length })}</Text>
      </View>

      <FlatList
        data={ALL_CASES}
        keyExtractor={(item) => item.case_id}
        renderItem={({ item }) => <CaseCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  subtitle: {
    fontSize: Fonts.small,
    color: Colors.gray,
    marginTop: 2,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.card,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  caseEmoji: {
    fontSize: 36,
  },
  caseInfo: {
    gap: 2,
    flex: 1,
  },
  caseTitle: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  caseSub: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  rewardText: {
    fontSize: Fonts.xs,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  arrow: {
    fontSize: 24,
    color: Colors.gray,
    fontWeight: '300',
  },
});
