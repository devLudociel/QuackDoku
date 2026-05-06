import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { CASE_MAP } from '../../constants/cases';
import { DUCK_MAP } from '../../constants/ducks';
import Button from '../../components/ui/Button';
import DuckAvatar from '../../components/ui/DuckAvatar';
import GameAsset from '../../components/ui/GameAsset';

export default function CaseDetailScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const gameCase = CASE_MAP[caseId ?? ''];
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);

  if (!gameCase) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Caso no encontrado 🦆</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 108 }]}
      >
        <View style={styles.heroImage}>
          <Text style={styles.heroEmoji}>🏰</Text>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{gameCase.title}</Text>
            <Text style={styles.heroLocation}>📍 {gameCase.location}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Difficulty + time target */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Dificultad</Text>
              <Text>{'⭐'.repeat(gameCase.difficulty)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Objetivo</Text>
              <Text style={styles.metaValue}>⏱ {formatTime(gameCase.time_target)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Premio</Text>
              <View style={styles.metaIconValue}>
                <Text style={styles.metaValue}>+{gameCase.rewards.coins}</Text>
                <GameAsset name="coin" size={18} />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📖 El caso</Text>
            <Text style={styles.storyText} numberOfLines={5}>{gameCase.story_intro}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🦆 Sospechosos</Text>
            <View style={styles.suspectsRow}>
              {gameCase.suspects.map((duckId) => {
                const duck = DUCK_MAP[duckId];
                if (!duck) return null;
                return (
                  <View key={duckId} style={styles.suspectChip}>
                    <DuckAvatar duck={duck} size={30} />
                    <Text style={styles.suspectName}>{duck.name.split(' ').slice(-1)[0]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.bottomCta, { paddingBottom: bottomInset + Spacing.sm }]}>
        <Button
          label="Jugar caso 🔍"
          onPress={() => router.push(`/game/${gameCase.case_id}`)}
          fullWidth
          style={styles.ctaButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: Fonts.h3,
    color: Colors.gray,
  },
  heroImage: {
    height: 132,
    backgroundColor: Colors.blackPremium,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: Fonts.body,
    fontWeight: '800',
  },
  heroLocation: {
    color: Colors.grayLight,
    fontSize: Fonts.small,
    marginTop: 2,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.badge,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  metaLabel: {
    fontSize: Fonts.xs,
    color: Colors.gray,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  metaIconValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  storyText: {
    fontSize: Fonts.small,
    color: Colors.gray,
    lineHeight: 20,
  },
  suspectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suspectChip: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    minWidth: 58,
  },
  suspectName: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomCta: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  ctaButton: {
    height: 52,
  },
});
