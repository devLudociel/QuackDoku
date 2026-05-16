import React, { useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius, Spacing, Shadow } from '../../constants/theme';

export interface TutorialStep {
  title: string;
  body: string;
  emoji?: string;
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export const DEFAULT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: '🦆',
    title: 'Bienvenido detective',
    body: 'QuackDoku es un sudoku de patos. Cada sospechoso debe aparecer una sola vez por fila, columna y area.',
  },
  {
    emoji: '👇',
    title: 'Toca un sospechoso',
    body: 'Selecciona un pato del panel inferior. Algunos casos muestran pistas al elegirlo.',
  },
  {
    emoji: '🎯',
    title: 'Toca una casilla',
    body: 'Coloca al sospechoso en la celda libre que creas correcta. Si se repite en su fila/columna/area, pierdes una vida.',
  },
  {
    emoji: '💡',
    title: 'Pistas y acusar',
    body: 'Usa "Pista" si te bloqueas. Cuando termines en modo investigacion, pulsa "Acusar" para enviar la solucion.',
  },
];

export default function TutorialOverlay({ visible, steps, onComplete, onSkip }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    if (index >= steps.length - 1) {
      setIndex(0);
      onComplete();
      return;
    }
    setIndex((current) => current + 1);
  }, [index, steps.length, onComplete]);

  const skip = useCallback(() => {
    setIndex(0);
    onSkip();
  }, [onSkip]);

  const step = steps[index];
  if (!step) return null;

  const isLast = index === steps.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>

          {step.emoji ? <Text style={styles.emoji}>{step.emoji}</Text> : null}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? 'Entendido, jugar' : 'Siguiente'}
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>
              {isLast ? 'Cerrar' : 'Saltar tutorial'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 9, 19, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.navyCard,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.darkCard,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.navyMuted,
  },
  dotActive: {
    backgroundColor: Colors.yellow,
    width: 22,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Fonts.body,
    color: Colors.whiteMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    backgroundColor: Colors.yellow,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: Colors.ink,
    fontWeight: '800',
    fontSize: Fonts.body,
  },
  skipBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipBtnText: {
    color: Colors.grayMuted,
    fontSize: Fonts.small,
    fontWeight: '600',
  },
});
