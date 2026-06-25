import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { AuthProvider } from '../contexts/AuthContext';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface Props {
  onDeviceUnregistered: () => void;
}

export function AppNavigator({ onDeviceUnregistered }: Props) {
  return (
    <AuthProvider onDeviceUnregistered={onDeviceUnregistered}>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: { backgroundColor: '#ffffff' },
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '600' },
        }}>
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🔔</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>👤</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </AuthProvider>
  );
}
