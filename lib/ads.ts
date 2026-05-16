import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { RewardedPlacement } from './monetization';
import { MONETIZATION_PLACEMENTS } from './monetization';
import { track } from './telemetry';

type RewardedResult = 'earned' | 'closed' | 'unavailable';

function getAdUnitId(placement: RewardedPlacement): string | null {
  const adsEnabled =
    process.env.EXPO_PUBLIC_ADS_ENABLED === 'true' ||
    Constants.expoConfig?.extra?.adsEnabled === true;
  if (!adsEnabled) return null;

  const placements = MONETIZATION_PLACEMENTS.rewarded;
  const config = Object.values(placements).find((item) => item.placement === placement);
  if (!config) return null;

  const extra = Constants.expoConfig?.extra ?? {};
  const key = config.adUnitKey;
  const platformUnits = Platform.OS === 'ios' ? extra.admobIosRewarded : extra.admobAndroidRewarded;
  if (platformUnits && typeof platformUnits === 'object' && key in platformUnits) {
    const value = platformUnits[key as keyof typeof platformUnits];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
  if (__DEV__ || process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true') {
    return '__TEST_REWARDED__';
  }
  return null;
}

export async function showRewardedAd(placement: RewardedPlacement): Promise<RewardedResult> {
  const adUnitId = getAdUnitId(placement);
  if (!adUnitId || Platform.OS === 'web') return 'unavailable';

  try {
    const ads = await import('react-native-google-mobile-ads');
    const RewardedAd = ads.RewardedAd;
    const RewardedAdEventType = ads.RewardedAdEventType;
    const AdEventType = ads.AdEventType;
    const resolvedAdUnitId = adUnitId === '__TEST_REWARDED__' ? ads.TestIds.REWARDED : adUnitId;

    return await new Promise<RewardedResult>((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(resolvedAdUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });
      let earned = false;
      const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        unsubEarned();
        unsubClosed();
        resolve(earned ? 'earned' : 'closed');
      });
      const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        unsubLoaded();
        rewarded.show();
      });
      const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
        unsubEarned();
        unsubClosed();
        unsubLoaded();
        unsubError();
        resolve('unavailable');
      });
      rewarded.load();
    });
  } catch (error) {
    if (__DEV__) console.warn('[ads] rewarded failed', error);
    track('rewarded_ad_requested', { placement, available: false });
    return 'unavailable';
  }
}
