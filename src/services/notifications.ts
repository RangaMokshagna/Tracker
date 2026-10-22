/**
 * STRIDE — Push & Local Notification Service
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[STRIDE] Notifications permission error:', e);
    return false;
  }
}

export async function scheduleDailyMotivation(hour = 7, minute = 30): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  try {
    // Cancel existing motivations
    await Notifications.cancelAllScheduledNotificationsAsync();

    const motivationalMessages = [
      "Rise and stride! Today's goal is 5 km. Let's build your streak.",
      "Consistency beats perfection. A 20-minute easy run keeps your momentum alive.",
      "The hardest part is lacing up your shoes. Your future self will thank you.",
      "Your weekly mileage is on track! Get outside and breathe today.",
      "STRIDE AI Coach: Your recovery looks solid. Ready for today's tempo session?",
    ];

    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'STRIDE Daily Motivation ⚡',
        body: randomMsg,
        sound: true,
        data: { screen: 'run' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch (err) {
    console.warn('[STRIDE] Failed scheduling daily notification:', err);
    return null;
  }
}

export async function sendInstantMilestoneAlert(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (e) {
    console.warn('[STRIDE] Instant notification failed:', e);
  }
}
