import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing } from '../../constants/theme';

interface HeartsDisplayProps {
  hearts: number;
  maxHearts: number;
}

export default function HeartsDisplay({ hearts, maxHearts }: HeartsDisplayProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxHearts }, (_, i) => (
        <Text key={i} style={styles.heart}>
          {i < hearts ? '❤️' : '🖤'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  heart: {
    fontSize: 20,
  },
});
