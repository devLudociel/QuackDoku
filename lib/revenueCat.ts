import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { track } from './telemetry';

let configured = false;

function getRevenueCatKey(): string | null {
  const extra = Constants.expoConfig?.extra ?? {};
  const key = Platform.OS === 'ios' ? extra.revenueCatIosApiKey : extra.revenueCatAndroidApiKey;
  if (typeof key !== 'string' || key.length === 0 || key.includes('replace_me')) return null;
  return key;
}

export async function initRevenueCat(userId: string): Promise<boolean> {
  if (Platform.OS === 'web' || configured) return configured;
  const apiKey = getRevenueCatKey();
  if (!apiKey) return false;

  try {
    const PurchasesModule = await import('react-native-purchases');
    const Purchases = PurchasesModule.default;
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
    track('iap_revenuecat_ready');
    return true;
  } catch (error) {
    if (__DEV__) console.warn('[revenuecat] init failed', error);
    return false;
  }
}

export async function refreshRevenueCatEntitlements(): Promise<void> {
  if (!configured) return;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    const ownsLeaguePass = !!info.entitlements.active.league_pass;
    useUserStore.getState().setLeaguePassOwned(ownsLeaguePass);
    track('iap_entitlements_refreshed', { league_pass: ownsLeaguePass });
  } catch (error) {
    if (__DEV__) console.warn('[revenuecat] entitlement refresh failed', error);
  }
}

export async function purchaseLeaguePass(): Promise<boolean> {
  if (!configured) return false;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (item) => item.product.identifier === 'quackdoku.league_pass.weekly'
    ) ?? offerings.current?.availablePackages[0];
    if (!pkg) return false;
    const result = await Purchases.purchasePackage(pkg);
    const ownsLeaguePass = !!result.customerInfo.entitlements.active.league_pass;
    useUserStore.getState().setLeaguePassOwned(ownsLeaguePass);
    track('iap_purchased', { product_id: pkg.product.identifier, league_pass: ownsLeaguePass });
    return ownsLeaguePass;
  } catch (error) {
    if (__DEV__) console.warn('[revenuecat] purchase failed', error);
    return false;
  }
}
