import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RemoteNotification } from '../types/notification';

const REMOTE_API_BASE = 'https://tools.ad-hoc.app';

// Auth

type LoginResult =
  | { success: true; accessToken: string; refreshToken: string }
  | { success: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${REMOTE_API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (response.ok && body.success) {
      return {
        success: true,
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken,
      };
    }
    return { success: false, error: body.error ?? 'Login failed' };
  } catch {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// Notification management

export async function listNotifications(
  token: string,
  limit = 50,
  offset = 0,
): Promise<RemoteNotification[]> {
  const url = new URL(`${REMOTE_API_BASE}/api/notifications`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Unexpected status: ${response.status}`);
  const body = await response.json();
  return body.data as RemoteNotification[];
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(
    `${REMOTE_API_BASE}/api/notifications/${notificationId}/read`,
    { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Unexpected status: ${response.status}`);
}

export async function deleteRemoteNotification(
  token: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(
    `${REMOTE_API_BASE}/api/notifications/${notificationId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Unexpected status: ${response.status}`);
}

export async function unregisterDevice(
  token: string,
  pushToken: string,
): Promise<void> {
  const response = await fetch(`${REMOTE_API_BASE}/api/notifications/device`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ push_token: pushToken }),
  });
  if (!response.ok) throw new Error(`Unexpected status: ${response.status}`);
}

// Device registration (QR-code-provided base URL)

type RegisterResult =
  | { success: true; userId: number }
  | { success: false; error: string };

export async function registerDevice(
  apiUrl: string,
  registrationToken: string,
  pushToken: string,
  deviceLabel?: string,
): Promise<RegisterResult> {
  const response = await fetch(`${apiUrl}/api/notifications/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registration_token: registrationToken,
      push_token: pushToken,
      platform: 'fcm',
      ...(deviceLabel ? { device_label: deviceLabel } : {}),
    }),
  });

  if (response.status === 201) {
    const body = await response.json();
    return { success: true, userId: body.data.user_id };
  }

  if (response.status === 401) {
    const body = await response.json();
    return { success: false, error: body.error ?? 'Registration failed' };
  }

  throw new Error(`Unexpected response status: ${response.status}`);
}

export async function sendHeartbeat(
  apiUrl: string,
  pushToken: string,
): Promise<void> {
  await fetch(`${apiUrl}/api/notifications/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ push_token: pushToken }),
  });
}

// Called by onTokenRefresh — reads stored apiUrl so it works without any prop drilling.
export async function heartbeatWithStoredUrl(newToken: string): Promise<void> {
  const apiUrl = await AsyncStorage.getItem('@adhoc/api_base_url');
  if (!apiUrl) return;
  await sendHeartbeat(apiUrl, newToken);
}
