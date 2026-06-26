import type { FC } from 'react';

interface QrScannerProps {
  onScan: (value: string) => void;
}

declare const QrScanner: FC<QrScannerProps>;
export default QrScanner;
