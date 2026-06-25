import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  getMessaging,
  getInitialNotification,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { AppNavigator } from './src/navigation/AppNavigator';
import { RegisterScreen } from './src/screens/RegisterScreen';
import NotificationService from './src/services/NotificationService';
import {
  addNotification,
  getRegistrationState,
} from './src/services/storage';
import { sendHeartbeat } from './src/services/api';

type BootState = 'loading' | 'unregistered' | 'registered';

export default function App() {
  const [bootState, setBootState] = useState<BootState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await NotificationService.getInstance().initialize();

      const token = await NotificationService.getInstance().getFCMToken();
      const { isRegistered, apiBaseUrl } = await getRegistrationState();

      if (cancelled) return;

      if (isRegistered && apiBaseUrl && token) {
        // Fire-and-forget — heartbeat failure must never block launch.
        sendHeartbeat(apiBaseUrl, token).catch(() => {});
        setBootState('registered');
      } else {
        setBootState('unregistered');
      }
    }

    // App was killed and user tapped a notification to open it.
    getInitialNotification(getMessaging()).then(remoteMessage => {
      if (!remoteMessage) return;
      addNotification({
        id: remoteMessage.messageId ?? Date.now().toString(),
        title: remoteMessage.notification?.title ?? 'Notification',
        body: remoteMessage.notification?.body ?? '',
        timestamp: Date.now(),
        data: remoteMessage.data as Record<string, string> | undefined,
      }).catch(() => {});
    });

    // App was in background and user tapped a notification.
    const unsubTap = onNotificationOpenedApp(
      getMessaging(),
      remoteMessage => {
        addNotification({
          id: remoteMessage.messageId ?? Date.now().toString(),
          title: remoteMessage.notification?.title ?? 'Notification',
          body: remoteMessage.notification?.body ?? '',
          timestamp: Date.now(),
          data: remoteMessage.data as Record<string, string> | undefined,
        }).catch(() => {});
      },
    );

    bootstrap().catch(console.error);

    return () => {
      cancelled = true;
      unsubTap();
      NotificationService.getInstance().cleanup();
    };
  }, []);

  if (bootState === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (bootState === 'unregistered') {
    return (
      <SafeAreaProvider>
        <RegisterScreen onRegistered={() => setBootState('registered')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
});
