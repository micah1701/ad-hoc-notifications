import { Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import type { StoredNotification } from '../types/notification';
import { addNotification } from './storage';
import { heartbeatWithStoredUrl } from './api';

type ForegroundCallback = (notification: StoredNotification) => void;

class NotificationService {
  private static instance: NotificationService;
  private unsubscribeForeground: (() => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await this.requestPermission();
    await this.createNotificationChannel();
    this.setupTokenRefresh();
  }

  private async requestPermission(): Promise<void> {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Notification permission not granted');
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  }

  private async createNotificationChannel(): Promise<void> {
    try {
      await notifee.createChannel({
        id: 'default',
        name: 'Push Notifications',
        importance: AndroidImportance.HIGH,
      });
    } catch (err) {
      console.warn('Failed to create notification channel:', err);
    }
  }

  // Wire up unconditionally — sends heartbeat with new token whenever Firebase rotates it.
  private setupTokenRefresh(): void {
    this.unsubscribeTokenRefresh?.();
    this.unsubscribeTokenRefresh = onTokenRefresh(
      getMessaging(),
      async newToken => {
        heartbeatWithStoredUrl(newToken).catch(() => {});
      },
    );
  }

  async getFCMToken(): Promise<string | null> {
    if (Platform.OS !== 'android') return null;
    try {
      return await getToken(getMessaging());
    } catch (err) {
      console.warn('Failed to get FCM token:', err);
      return null;
    }
  }

  subscribeToForegroundMessages(callback: ForegroundCallback): () => void {
    if (Platform.OS !== 'android') return () => {};

    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      const notification: StoredNotification = {
        id: remoteMessage.messageId ?? Date.now().toString(),
        title: remoteMessage.notification?.title ?? 'Notification',
        body: remoteMessage.notification?.body ?? '',
        timestamp: Date.now(),
        data: remoteMessage.data as Record<string, string> | undefined,
      };
      await addNotification(notification);
      callback(notification);

      try {
        await notifee.displayNotification({
          title: notification.title,
          body: notification.body,
          android: { channelId: 'default' },
        });
      } catch {}
    });

    this.unsubscribeForeground = unsubscribe;
    return unsubscribe;
  }

  cleanup(): void {
    this.unsubscribeForeground?.();
    this.unsubscribeForeground = null;
    this.unsubscribeTokenRefresh?.();
    this.unsubscribeTokenRefresh = null;
  }
}

export default NotificationService;
