import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AppState } from 'react-native';

class NotificationService {
  constructor() {
    this.channelId = 'MyQNo_Channel';
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    // Request permissions (required for iOS, recommended for Android 13+)
    await notifee.requestPermission();
    await messaging().requestPermission();

    // Create the Notification Channel for Android
    await notifee.createChannel({
      id: this.channelId,
      name: 'MyQNo Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Foreground message handler
    messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle background / quit state notification events (e.g., Action Button presses)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      this.handleNotifeeAction(type, detail);
    });

    // Handle foreground notification events
    notifee.onForegroundEvent(({ type, detail }) => {
      this.handleNotifeeAction(type, detail);
    });

    this.isInitialized = true;
    console.log('Notification Service Initialized');

    try {
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

      // Listen to whether the token changes
      messaging().onTokenRefresh(token => {
        console.log('FCM Token refreshed:', token);
      });
    } catch (e) {
      console.log('Error fetching FCM Token:', e);
    }
  }

  handleNotifeeAction(type, detail) {
    if (type === EventType.ACTION_PRESS) {
      console.log('Notification Action Pressed:', detail.pressAction.id);
      const payload = detail.notification?.data;

      if (detail.pressAction.id === 'COMING') {
        // Handle Coming action
        console.log('User is coming:', payload);
        // TODO: Map to native ACCEPT token logic
      } else if (detail.pressAction.id === 'NOT_COMING') {
        // Handle Not Coming action
        console.log('User is not coming:', payload);
        // TODO: Map to native CANCEL token logic
      }
      notifee.cancelNotification(detail.notification.id);
    }
  }

  async displayNotification(remoteMessage) {
    const { data, notification } = remoteMessage;
    const title = notification?.title || data?.title || 'MyQNo';
    const body = notification?.body || data?.message || '';
    const category = data?.category || '';

    let notificationOptions = {
      title: title,
      body: body,
      data: data || {},
      android: {
        channelId: this.channelId,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher', // Ensure this icon exists or use default
        pressAction: {
          id: 'default',
        },
      },
    };

    // Replicate Native "BUZZ" logic
    if (category.toUpperCase() === 'BUZZ') {
      notificationOptions.android.actions = [
        {
          title: 'Coming',
          pressAction: { id: 'COMING' },
        },
        {
          title: 'Not Coming',
          pressAction: { id: 'NOT_COMING' },
        },
      ];
      // Note: Triggering hardware flash is not natively supported directly by Notifee without native modules
    }

    await notifee.displayNotification(notificationOptions);
  }
}

export const notificationService = new NotificationService();
