import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        QR scanning is not available on this device.{'\n'}Use the link field
        below.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
