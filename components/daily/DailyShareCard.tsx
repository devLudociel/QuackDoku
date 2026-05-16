import React, { useMemo } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/theme';
import Button from '../ui/Button';
import { buildDailyShareText, formatDailyTime } from '../../lib/daily';
import { track } from '../../lib/telemetry';
import DuckAvatar from '../ui/DuckAvatar';
import { DUCK_MAP } from '../../constants/ducks';

interface DailyShareCardProps {
  stars: number;
  timeSeconds: number;
  errors: number;
  shareGrid: string[][];
  dayNumber: number;
  caseName: string;
}

export default function DailyShareCard({
  stars,
  timeSeconds,
  errors,
  shareGrid,
  dayNumber,
  caseName,
}: DailyShareCardProps) {
  const shareText = useMemo(
    () => buildDailyShareText({ stars, timeSeconds, errors, shareGrid, dayNumber, caseName }),
    [caseName, dayNumber, errors, shareGrid, stars, timeSeconds]
  );

  const handleShare = async () => {
    track('daily_shared', { day_number: dayNumber, stars, time_seconds: timeSeconds, errors });
    try {
      await Share.share({ message: shareText });
    } catch {
      Alert.alert('Resultado diario', shareText);
    }
  };

  const safeStars = Math.max(0, Math.min(3, stars));
  const safeErrors = Math.max(0, Math.min(3, errors));

  return (
    <View style={styles.card}>
      <Text style={styles.stars}>{'★'.repeat(safeStars)}{'☆'.repeat(3 - safeStars)}</Text>
      <Text style={styles.kicker}>CASO DEL DIA #{dayNumber}</Text>
      <DuckAvatar duck={DUCK_MAP.duck_tophat} size={92} style={styles.avatar} />
      <Text style={styles.caseName}>{caseName}</Text>

      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatDailyTime(timeSeconds)}</Text>
          <Text style={styles.statLabel}>Tiempo</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{safeErrors}</Text>
          <Text style={styles.statLabel}>Errores</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{'❤️'.repeat(3 - safeErrors)}</Text>
          <Text style={styles.statLabel}>Vidas</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {shareGrid.map((row, index) => (
          <Text key={`${index}-${row.join('')}`} style={styles.gridRow}>
            {row.join('')}
          </Text>
        ))}
      </View>

      <Button label="↗ Compartir" onPress={handleShare} fullWidth style={styles.shareButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.darkCard,
  },
  stars: {
    color: Colors.yellow,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
  },
  kicker: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatar: {
    marginVertical: Spacing.sm,
  },
  caseName: {
    fontSize: Fonts.h3,
    color: Colors.white,
    fontWeight: '900',
    textAlign: 'center',
  },
  statsStrip: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.navyMuted,
    borderRadius: Radius.badge,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    minHeight: 58,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    color: Colors.yellow,
    fontSize: Fonts.body,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.whiteMuted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  grid: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.badge,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  gridRow: {
    fontSize: 18,
    letterSpacing: 0,
  },
  shareButton: {
    marginTop: Spacing.xs,
  },
});
