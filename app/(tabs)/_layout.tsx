// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.secondary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      {/* ── VISIBLE TABS ─────────────────────────────────────── */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="corrosion/index"
        options={{
          title: 'Corrosion',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="shield.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="blast/index"
        options={{
          title: 'Blast',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="flame.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="concrete/index"
        options={{
          title: 'Concrete',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="cube.fill" color={color} />
          ),
        }}
      />

      {/* ── HIDDEN FROM TAB BAR (href: null) ─────────────────── */}

      {/* Results screens — navigated to programmatically */}
      <Tabs.Screen name="corrosion/results" options={{ href: null }} />
      <Tabs.Screen name="blast/results"     options={{ href: null }} />
      <Tabs.Screen name="concrete/results"  options={{ href: null }} />

      {/* Departments screen — accessed from Home, not a tab */}
      <Tabs.Screen name="departments"       options={{ href: null }} />

      {/* Explore — legacy scaffold screen, hidden until replaced */}
      <Tabs.Screen name="explore"           options={{ href: null }} />

    </Tabs>
  );
}