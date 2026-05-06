import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';
import { APP_ASSETS, AppAssetName } from '../../constants/assets';

interface GameAssetProps {
  name: AppAssetName;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export default function GameAsset({
  name,
  size = 24,
  width,
  height,
  style,
}: GameAssetProps) {
  return (
    <Image
      source={APP_ASSETS[name]}
      resizeMode="contain"
      style={[
        styles.image,
        {
          width: width ?? size,
          height: height ?? size,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
