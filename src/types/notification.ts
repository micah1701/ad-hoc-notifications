export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  data?: Record<string, string>;
}

export interface RemoteNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  platform: string;
  status: string;
  sent_at: string;
  read_at: string | null;
}
