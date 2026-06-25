import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { NotificationItem } from '../components/NotificationItem';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteRemoteNotification,
  listNotifications,
  markNotificationRead,
} from '../services/api';
import NotificationService from '../services/NotificationService';
import { loadNotifications } from '../services/storage';
import type { RemoteNotification, StoredNotification } from '../types/notification';
import type { RootTabScreenProps } from '../types/navigation';

type Props = RootTabScreenProps<'Notifications'>;

const PAGE_SIZE = 50;

// Shape used for the remote list — id + read state tracked locally after mutations.
interface RemoteItem {
  notification: StoredNotification;
  isRead: boolean;
  remoteId: string;
}

function remoteToItem(r: RemoteNotification): RemoteItem {
  return {
    remoteId: r.id,
    isRead: r.read_at != null,
    notification: {
      id: r.id,
      title: r.title,
      body: r.body,
      timestamp: new Date(r.sent_at).getTime(),
    },
  };
}

export function NotificationsScreen(_props: Props) {
  const { isLoggedIn, token } = useAuth();

  // Local (offline) mode state
  const [localNotifications, setLocalNotifications] = useState<StoredNotification[]>([]);

  // Remote mode state
  const [remoteItems, setRemoteItems] = useState<RemoteItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch a page of remote notifications
  const fetchRemote = useCallback(
    async (reset: boolean) => {
      if (!token) return;
      const offset = reset ? 0 : offsetRef.current;
      try {
        const page = await listNotifications(token, PAGE_SIZE, offset);
        const items = page.map(remoteToItem);
        setRemoteItems(prev => (reset ? items : [...prev, ...items]));
        offsetRef.current = offset + items.length;
        setHasMore(items.length === PAGE_SIZE);
      } catch {
        // leave existing items in place on error
      }
    },
    [token],
  );

  // Switch modes or re-fetch when login state changes
  useEffect(() => {
    let cancelled = false;

    if (isLoggedIn) {
      setLoadingRemote(true);
      offsetRef.current = 0;
      fetchRemote(true).then(() => {
        if (!cancelled) {
          setLoadingRemote(false);
          setInitialLoading(false);
        }
      });
    } else {
      loadNotifications().then(stored => {
        if (!cancelled) {
          setLocalNotifications(stored);
          setInitialLoading(false);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, fetchRemote]);

  // Subscribe to live push notifications in local mode
  useEffect(() => {
    if (isLoggedIn) return;
    const unsubscribe = NotificationService.getInstance().subscribeToForegroundMessages(
      newNotification => {
        setLocalNotifications(prev => [newNotification, ...prev]);
      },
    );
    return unsubscribe;
  }, [isLoggedIn]);

  const handleRefresh = async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    await fetchRemote(true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingRemote) return;
    setLoadingRemote(true);
    await fetchRemote(false);
    setLoadingRemote(false);
  };

  const handleMarkRead = async (remoteId: string) => {
    if (!token) return;
    setRemoteItems(prev =>
      prev.map(item =>
        item.remoteId === remoteId ? { ...item, isRead: true } : item,
      ),
    );
    try {
      await markNotificationRead(token, remoteId);
    } catch {
      // Revert optimistic update on failure
      setRemoteItems(prev =>
        prev.map(item =>
          item.remoteId === remoteId ? { ...item, isRead: false } : item,
        ),
      );
    }
  };

  const handleDelete = async (remoteId: string) => {
    if (!token) return;
    setRemoteItems(prev => prev.filter(item => item.remoteId !== remoteId));
    try {
      await deleteRemoteNotification(token, remoteId);
    } catch {
      // Item is already removed from UI — no need to revert since the user
      // expressed clear intent and a retry would be confusing.
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isLoggedIn) {
    return (
      <FlatList
        style={styles.list}
        contentContainerStyle={
          remoteItems.length === 0 ? styles.emptyContainer : styles.listContent
        }
        data={remoteItems}
        keyExtractor={item => item.remoteId}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item.notification}
            isRead={item.isRead}
            onMarkRead={() => handleMarkRead(item.remoteId)}
            onDelete={() => handleDelete(item.remoteId)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingRemote}>
              {loadingRemote ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={styles.loadMoreText}>Load more</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
      />
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={
        localNotifications.length === 0 ? styles.emptyContainer : styles.listContent
      }
      data={localNotifications}
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
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
