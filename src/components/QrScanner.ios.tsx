import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import {
  Camera,
  isScannedCode,
  useObjectOutput,
} from 'react-native-vision-camera';
import type { ScannedObject } from 'react-native-vision-camera';

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const onObjectsScanned = useCallback(
    (objects: ScannedObject[]) => {
      const code = objects.find(isScannedCode);
      if (code?.value) onScan(code.value);
    },
    [onScan],
  );

  const objectOutput = useObjectOutput({ types: ['qr'], onObjectsScanned });

  return (
    <Camera
      device="back"
      isActive
      outputs={[objectOutput]}
      style={StyleSheet.absoluteFill}
    />
  );
}
