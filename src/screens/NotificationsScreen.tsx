import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { NotificationItem } from '../components/NotificationItem';
import NotificationService from '../services/NotificationService';
import { loadNotifications } from '../services/storage';
import type { StoredNotification } from '../types/notification';
import type { RootTabScreenProps } from '../types/navigation';

type Props = RootTabScreenProps<'Notifications'>;

export function NotificationsScreen(_props: Props) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications().then(stored => {
      setNotifications(stored);
      setLoading(false);
    });

    const unsubscribe = NotificationService.getInstance().subscribeToForegroundMessages(
      newNotification => {
        setNotifications(prev => [newNotification, ...prev]);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <NotificationItem notification={item} />}
      ListEmptyComponent={<EmptyState />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
