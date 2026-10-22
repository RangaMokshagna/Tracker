const mockEnvironment = { executionEnvironment: 'storeClient' };
const mockPlatform = { OS: 'android' };
const mockNotifications = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
};
const mockLoadNotifications = jest.fn(() => mockNotifications);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: mockEnvironment,
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
jest.mock('react-native', () => ({ Platform: mockPlatform }));
jest.mock('expo-notifications', () => mockLoadNotifications());

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

it.each([
  ['android', 'storeClient'],
  ['ios', 'storeClient'],
  ['web', 'standalone'],
])('does not load native notifications on %s in %s', async (os, environment) => {
  mockPlatform.OS = os;
  mockEnvironment.executionEnvironment = environment;
  const service = await import('../src/services/notifications');
  expect(await service.requestNotificationPermission()).toBe(false);
  expect(await service.scheduleDailyMotivation()).toBeNull();
  await service.sendInstantMilestoneAlert('Milestone', 'Done');
  expect(mockLoadNotifications).not.toHaveBeenCalled();
});

it('loads once and schedules notifications in a native app build', async () => {
  mockPlatform.OS = 'android';
  mockEnvironment.executionEnvironment = 'standalone';
  const service = await import('../src/services/notifications');
  expect(mockLoadNotifications).not.toHaveBeenCalled();
  expect(await service.scheduleDailyMotivation(8, 15)).toBe('notification-id');
  await service.sendInstantMilestoneAlert('Milestone', 'Done');
  expect(mockLoadNotifications).toHaveBeenCalledTimes(1);
  expect(mockNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ trigger: { type: 'daily', hour: 8, minute: 15 } })
  );
  expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    content: { title: 'Milestone', body: 'Done', sound: true },
    trigger: null,
  });
});
import { beforeEach, expect, it, jest } from '@jest/globals';

