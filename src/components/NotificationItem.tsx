import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StoredNotification } from '../types/notification';

interface Props {
  notification: StoredNotification;
  isRead?: boolean;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

export function NotificationItem({ notification, isRead, onMarkRead, onDelete }: Props) {
  const formattedTime = new Date(notification.timestamp).toLocaleString();
  const hasActions = onMarkRead != null || onDelete != null;

  return (
    <View style={[styles.card, isRead && styles.cardRead]}>
      <View style={styles.row}>
        <Text style={[styles.title, isRead && styles.titleRead]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>
      <Text style={[styles.body, isRead && styles.bodyRead]} numberOfLines={3}>
        {notification.body}
      </Text>
      {hasActions && (
        <View style={styles.actions}>
          {onMarkRead != null && !isRead && (
            <TouchableOpacity onPress={onMarkRead} style={styles.actionButton}>
              <Text style={styles.markReadText}>Mark as read</Text>
            </TouchableOpacity>
          )}
          {onDelete != null && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  cardRead: {
    backgroundColor: '#f9fafb',
    shadowOpacity: 0.03,
    elevation: 1,
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
  titleRead: {
    color: '#6b7280',
    fontWeight: '400',
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
  bodyRead: {
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    paddingVertical: 2,
  },
  markReadText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
});
