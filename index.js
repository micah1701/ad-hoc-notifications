/**
 * @format
 */

import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { addNotification } from './src/services/storage';
import App from './App';
import { name as appName } from './app.json';

// Handles FCM messages when the app is in background or quit state.
// Must be registered before AppRegistry.registerComponent.
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  await addNotification({
    id: remoteMessage.messageId ?? Date.now().toString(),
    title: remoteMessage.notification?.title ?? 'Notification',
    body: remoteMessage.notification?.body ?? '',
    timestamp: Date.now(),
    data: remoteMessage.data,
  });
});

AppRegistry.registerComponent(appName, () => App);
