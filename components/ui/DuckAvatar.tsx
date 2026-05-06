import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { DUCK_MAP, Duck } from '../../constants/ducks';

interface DuckAvatarProps {
  duck?: Duck | null;
  duckId?: string;
  size: number;
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  emojiStyle?: StyleProp<TextStyle>;
}

export default function DuckAvatar({
  duck,
  duckId,
  size,
  dimmed = false,
  style,
  imageStyle,
  emojiStyle,
}: DuckAvatarProps) {
  const resolvedDuck = duck ?? (duckId ? DUCK_MAP[duckId] : null);
  const opacityStyle = dimmed ? styles.dimmed : null;
  const emoji = resolvedDuck?.emoji ?? '🦆';

  return (
    <View style={[styles.assetFrame, { width: size, height: size }, opacityStyle, style]}>
      {resolvedDuck?.asset ? (
        <Image
          source={resolvedDuck.asset}
          resizeMode="contain"
          style={[styles.assetImage, { width: size, height: size }, imageStyle]}
        />
      ) : (
        <Text
          style={[
            styles.emoji,
            { fontSize: size * 0.72, lineHeight: size },
            emojiStyle,
          ]}
        >
          {emoji}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  assetFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  assetImage: {
    flexShrink: 0,
  },
  emoji: {
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
});
