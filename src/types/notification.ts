export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  data?: Record<string, string>;
}
