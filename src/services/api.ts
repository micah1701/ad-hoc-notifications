import AsyncStorage from '@react-native-async-storage/async-storage';

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
