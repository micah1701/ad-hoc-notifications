import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  Camera,
  isScannedCode,
  useCameraDevice,
  useObjectOutput,
} from 'react-native-vision-camera';
import type { ScannedObject, ScannedObjectType } from 'react-native-vision-camera';

// Stable reference — avoids recreating the native CameraObjectOutput on every render.
const QR_TYPES: ScannedObjectType[] = ['qr'];

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const device = useCameraDevice('back');

  const onObjectsScanned = useCallback(
    (objects: ScannedObject[]) => {
      const code = objects.find(isScannedCode);
      if (code?.value) onScan(code.value);
    },
    [onScan],
  );

  const objectOutput = useObjectOutput({ types: QR_TYPES, onObjectsScanned });
  const outputs = useMemo(() => [objectOutput], [objectOutput]);

  if (!device) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color="#9ca3af" />
      </View>
    );
  }

  return (
    <Camera
      device={device}
      isActive
      outputs={outputs}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
