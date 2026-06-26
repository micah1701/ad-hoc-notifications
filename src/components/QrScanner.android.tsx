import React, { Suspense, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const handleReadCode = useCallback(
    ({ nativeEvent }: { nativeEvent: { codeStringValue: string } }) => {
      if (nativeEvent.codeStringValue) onScan(nativeEvent.codeStringValue);
    },
    [onScan],
  );

  return (
    <Suspense
      fallback={
        <View style={styles.waiting}>
          <ActivityIndicator color="#9ca3af" />
        </View>
      }
    >
      <Camera
        cameraType={CameraType.Back}
        scanBarcode
        onReadCode={handleReadCode}
        style={StyleSheet.absoluteFill}
      />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
