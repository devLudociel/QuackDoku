import React from 'react';
import { View, StyleSheet } from 'react-native';
import GameAsset from './GameAsset';

interface HeartsDisplayProps {
  hearts: number;
  maxHearts: number;
}

export default function HeartsDisplay({ hearts, maxHearts }: HeartsDisplayProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxHearts }, (_, i) => (
        <GameAsset key={i} name={i < hearts ? 'heartFull' : 'heartEmpty'} size={22} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
});
