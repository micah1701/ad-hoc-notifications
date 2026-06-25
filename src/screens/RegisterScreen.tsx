import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import QrScanner from '../components/QrScanner';
import { registerDevice } from '../services/api';
import { saveRegistrationState } from '../services/storage';
import NotificationService from '../services/NotificationService';

type Props = { onRegistered: () => void };

export function RegisterScreen({ onRegistered }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const processingRef = useRef(false);

  useEffect(() => {
    requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attemptRegistration = useCallback(
    async (registrationToken: string, apiBaseUrl: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setRegistering(true);
      setError(null);

      try {
        const pushToken =
          await NotificationService.getInstance().getFCMToken();
        if (!pushToken) {
          setError(
            'Could not set up notifications. Check that Google Play Services is up to date.',
          );
          return;
        }

        const result = await registerDevice(
          apiBaseUrl,
          registrationToken,
          pushToken,
        );

        if (result.success) {
          await saveRegistrationState(apiBaseUrl);
          onRegistered();
        } else {
          setError(
            'This QR code has expired or has already been used. Ask your admin to generate a new one.',
          );
        }
      } catch {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setRegistering(false);
        processingRef.current = false;
      }
    },
    [onRegistered],
  );

  const handleDeepLink = useCallback(
    (url: string) => {
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        const api = parsed.searchParams.get('api');

        if (!token || !api) {
          setError('Invalid QR code — missing required parameters.');
          return;
        }

        attemptRegistration(token, decodeURIComponent(api));
      } catch {
        setError('Could not read the QR code. Please try again.');
      }
    },
    [attemptRegistration],
  );

  const handleManualSubmit = () => {
    const input = manualInput.trim();
    if (!input) return;
    if (input.startsWith('adhocnotifications://')) {
      handleDeepLink(input);
    } else {
      setError(
        'Please paste the full registration link (adhocnotifications://register?...).',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Device</Text>
      <Text style={styles.body}>
        Scan the QR code provided by your admin to link this device.
      </Text>

      {registering ? (
        <View style={[styles.scannerBox, styles.scannerPlaceholder]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.registeringText}>Registering…</Text>
        </View>
      ) : hasPermission ? (
        <View style={styles.scannerBox}>
          <QrScanner onScan={handleDeepLink} />
        </View>
      ) : (
        <View style={[styles.scannerBox, styles.scannerPlaceholder]}>
          <Text style={styles.placeholderText}>
            Camera permission denied.{'\n'}Use the manual link field below.
          </Text>
        </View>
      )}

      {error != null && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.fallbackLabel}>Or paste the registration link:</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={manualInput}
          onChangeText={setManualInput}
          placeholder="adhocnotifications://register?token=…"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!registering}
        />
        <TouchableOpacity
          style={[styles.submitButton, registering && styles.submitDisabled]}
          onPress={handleManualSubmit}
          disabled={registering}>
          <Text style={styles.submitText}>Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  scannerBox: {
    width: 240,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scannerPlaceholder: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  registeringText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  fallbackLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
