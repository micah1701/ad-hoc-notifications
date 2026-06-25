import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredNotification } from '../types/notification';

const NOTIFICATIONS_KEY = '@adhoc/notifications';
const DEVICE_REGISTERED_KEY = '@adhoc/device_registered';
const API_BASE_URL_KEY = '@adhoc/api_base_url';
const MAX_STORED = 200;

export async function getRegistrationState(): Promise<{
  isRegistered: boolean;
  apiBaseUrl: string | null;
}> {
  try {
    const results = await AsyncStorage.getMany([
      DEVICE_REGISTERED_KEY,
      API_BASE_URL_KEY,
    ]);
    return {
      isRegistered: results[DEVICE_REGISTERED_KEY] === 'true',
      apiBaseUrl: results[API_BASE_URL_KEY] ?? null,
    };
  } catch {
    return { isRegistered: false, apiBaseUrl: null };
  }
}

export async function saveRegistrationState(
  apiBaseUrl: string,
): Promise<void> {
  await AsyncStorage.setMany({
    [DEVICE_REGISTERED_KEY]: 'true',
    [API_BASE_URL_KEY]: apiBaseUrl,
  });
}

export async function loadNotifications(): Promise<StoredNotification[]> {
  try {
    const json = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (!json) return [];
    return JSON.parse(json) as StoredNotification[];
  } catch {
    return [];
  }
}

export async function addNotification(
  notification: StoredNotification,
): Promise<StoredNotification[]> {
  try {
    const existing = await loadNotifications();
    const updated = [notification, ...existing].slice(0, MAX_STORED);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [notification];
  }
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
}
