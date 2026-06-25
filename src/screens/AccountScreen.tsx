import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { unregisterDevice } from '../services/api';
import { clearRegistrationState } from '../services/storage';
import NotificationService from '../services/NotificationService';

export function AccountScreen() {
  const { isLoggedIn, token, login, logout, onDeviceUnregistered } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Login failed');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'You will still receive notifications, but you won\'t be able to manage them from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', onPress: () => logout() },
    ]);
  };

  const handleUnregisterDevice = () => {
    Alert.alert(
      'Unregister Device',
      'This will stop all push notifications to this device. To receive notifications again, you will need to scan a new QR code from your admin. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            try {
              const pushToken = await NotificationService.getInstance().getFCMToken();
              if (pushToken && token) {
                await unregisterDevice(token, pushToken);
              }
              await clearRegistrationState();
              onDeviceUnregistered();
            } catch {
              Alert.alert('Error', 'Could not unregister device. Please check your connection and try again.');
            }
          },
        },
      ],
    );
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.loggedInBadge}>
            <Text style={styles.loggedInIcon}>✓</Text>
            <Text style={styles.loggedInText}>Logged in</Text>
          </View>
          <Text style={styles.loggedInSubtitle}>
            You can view your notification history, mark notifications as read, and delete them from the Notifications tab.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDescription}>
            Unregistering your device will permanently stop push notifications. You will need a new QR code from your admin to set up this device again.
          </Text>
          <TouchableOpacity
            style={styles.unregisterButton}
            onPress={handleUnregisterDevice}>
            <Text style={styles.unregisterButtonText}>Unregister This Device</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.subtitle}>
          Login is optional. Notifications will still be delivered without it.{'\n\n'}
          Log in if you want to view your notification history, mark notifications as read, or delete them.
        </Text>

        {error != null && <Text style={styles.error}>{error}</Text>}

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            textContentType="password"
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}>
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in…' : 'Log In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Logged-in state
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  loggedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  loggedInIcon: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },
  loggedInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  loggedInSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  dangerSection: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerDescription: {
    fontSize: 13,
    color: '#be123c',
    lineHeight: 20,
    marginBottom: 14,
  },
  unregisterButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unregisterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
