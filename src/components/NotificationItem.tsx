import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StoredNotification } from '../types/notification';

interface Props {
  notification: StoredNotification;
}

export function NotificationItem({ notification }: Props) {
  const formattedTime = new Date(notification.timestamp).toLocaleString();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>
      <Text style={styles.body} numberOfLines={3}>
        {notification.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    flexShrink: 0,
  },
  body: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
