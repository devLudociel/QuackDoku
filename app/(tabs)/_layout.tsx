import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.grayLight,
          borderTopWidth: 1,
          height: 62 + bottomInset,
          paddingBottom: bottomInset + 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.blackPremium,
        tabBarInactiveTintColor: Colors.gray,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Casos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: 'Patos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🦆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕵️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
