import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const btnStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
      ? styles.secondary
      : styles.ghost;

  const txtStyle =
    variant === 'primary'
      ? styles.primaryText
      : variant === 'secondary'
      ? styles.secondaryText
      : styles.ghostText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        btnStyle,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.baseText, txtStyle, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  primary: {
    backgroundColor: Colors.yellow,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.4,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: Colors.blackPremium,
  },
  secondaryText: {
    color: Colors.blackPremium,
  },
  ghostText: {
    color: Colors.blackPremium,
  },
});
