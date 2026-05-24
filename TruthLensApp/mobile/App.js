// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

import AnalyzeScreen from './screens/AnalyzeScreen';
import FeedScreen from './screens/FeedScreen';
import SearchScreen from './screens/SearchScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const DARK = {
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  text: '#f1f5f9',
  muted: '#94a3b8',
  primary: '#6366f1',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: DARK.primary,
            background: DARK.background,
            card: DARK.surface,
            text: DARK.text,
            border: DARK.border,
            notification: DARK.primary,
          },
        }}
      >
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: DARK.surface },
            headerTintColor: DARK.text,
            headerTitleStyle: { fontWeight: '700' },
            tabBarStyle: {
              backgroundColor: DARK.surface,
              borderTopColor: DARK.border,
              paddingBottom: 6,
              height: 62,
            },
            tabBarActiveTintColor: DARK.primary,
            tabBarInactiveTintColor: DARK.muted,
            tabBarIcon: ({ focused, color, size }) => {
              const icons = {
                Analyze: focused ? 'shield' : 'shield-outline',
                Feed: focused ? 'newspaper' : 'newspaper-outline',
                Search: focused ? 'search' : 'search-outline',
                History: focused ? 'time' : 'time-outline',
                Profile: focused ? 'person' : 'person-outline',
              };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Analyze" component={AnalyzeScreen} options={{ title: '🔍 Analyze' }} />
          <Tab.Screen name="Feed" component={FeedScreen} options={{ title: '📰 My Feed' }} />
          <Tab.Screen name="Search" component={SearchScreen} options={{ title: '🔎 Search' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ title: '📋 History' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '👤 Profile' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
