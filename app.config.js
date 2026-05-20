const useAdMobTestMode = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';
const androidAdMobAppId =
  process.env.ADMOB_ANDROID_APP_ID ||
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
  (useAdMobTestMode ? 'ca-app-pub-3940256099942544~3347511713' : undefined);
const iosAdMobAppId =
  process.env.ADMOB_IOS_APP_ID ||
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
  (useAdMobTestMode ? 'ca-app-pub-3940256099942544~1458002511' : undefined);

const plugins = [
  'expo-router',
  [
    'expo-audio',
    {
      microphonePermission: false,
      recordAudioAndroid: false,
    },
  ],
  'expo-asset',
  'expo-font',
  'expo-dev-client',
  'expo-notifications',
];

if (androidAdMobAppId && iosAdMobAppId) {
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId: androidAdMobAppId,
      iosAppId: iosAdMobAppId,
      userTrackingUsageDescription:
        'This identifier may be used to show relevant ads and measure ad performance.',
    },
  ]);
}

module.exports = {
  expo: {
    name: 'QuackDoku',
    slug: 'quackdoku',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'quackdoku',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFCC00',
    },
    plugins,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      adsEnabled: process.env.EXPO_PUBLIC_ADS_ENABLED === 'true',
      admobAndroidRewarded: {
        rewarded_hint_basic: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_HINT,
        rewarded_continue_game_over: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_CONTINUE,
      },
      admobIosRewarded: {
        rewarded_hint_basic: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_HINT,
        rewarded_continue_game_over: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_CONTINUE,
      },
      revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.quackdoku.app',
      infoPlist: {
        NSUserTrackingUsageDescription:
          'This identifier may be used to show relevant ads and measure ad performance.',
      },
    },
    android: {
      package: 'com.quackdoku.app',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFCC00',
      },
      permissions: [
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
      output: 'single',
    },
  },
};
