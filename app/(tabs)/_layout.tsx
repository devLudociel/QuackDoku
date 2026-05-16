import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.iconText, !focused && styles.iconMuted]}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.grayLight,
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingBottom: bottomInset + 7,
          paddingTop: 7,
        },
        tabBarActiveTintColor: Colors.blackPremium,
        tabBarInactiveTintColor: Colors.grayMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t('tabs.cases'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="◈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: t('tabs.ducks'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="♟" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t('tabs.shop'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚑" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="◎" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.yellow,
  },
  iconText: {
    fontSize: 18,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  iconMuted: {
    color: Colors.grayMuted,
  },
});
