// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="corrosion"
        options={{
          title: 'Corrosion',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="blast"
        options={{
          title: 'Blast',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="concrete"
        options={{
          title: 'Concrete',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
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
