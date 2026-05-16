import type { ImageSourcePropType } from 'react-native';

export const APP_ASSETS = {
  logo: require('../assets/logo.png') as ImageSourcePropType,
  coin: require('../assets/coin.png') as ImageSourcePropType,
  clue: require('../assets/clue.png') as ImageSourcePropType,
  heartFull: require('../assets/heart_full.png') as ImageSourcePropType,
  heartEmpty: require('../assets/heart_empty.png') as ImageSourcePropType,
};

export type AppAssetName = keyof typeof APP_ASSETS;
