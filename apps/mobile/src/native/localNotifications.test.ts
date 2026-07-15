import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPermissions: vi.fn(),
  getScheduled: vi.fn(),
  cancelScheduled: vi.fn(),
  schedule: vi.fn(),
  addResponseListener: vi.fn(),
}));

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  setNotificationCategoryAsync: vi.fn(),
  getPermissionsAsync: mocks.getPermissions,
  requestPermissionsAsync: vi.fn(),
  getAllScheduledNotificationsAsync: mocks.getScheduled,
  cancelScheduledNotificationAsync: mocks.cancelScheduled,
  scheduleNotificationAsync: mocks.schedule,
  addNotificationResponseReceivedListener: mocks.addResponseListener,
}));
vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }));
vi.mock('../i18n/format', () => ({ formatCurrency: (value: number) => String(value) }));

import type { Bill } from '../types';
import {
  NOTIFICATION_ACTIONS,
  scheduleLocalBillReminders,
  subscribeToNotificationActions,
} from './localNotifications';

const bill = {
  id: 41,
  name: 'Rent',
  amount: 1200,
  frequency: 'monthly',
  frequency_type: 'simple',
  frequency_config: '{}',
  next_due: '2026-08-15',
  reminder_enabled: true,
  reminder_days: [7],
  archived: false,
  type: 'expense',
} as Bill;

describe('profile-scoped local notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPermissions.mockResolvedValue({ granted: true });
    mocks.schedule.mockResolvedValue('scheduled');
  });

  it('replaces reminders only inside the requested server and database scope', async () => {
    mocks.getScheduled.mockResolvedValue([
      { identifier: 'same', content: { data: { source: 'billmanager-local-reminder', serverProfileId: 'server-a', databaseId: 'home' } } },
      { identifier: 'other-profile', content: { data: { source: 'billmanager-local-reminder', serverProfileId: 'server-b', databaseId: 'home' } } },
      { identifier: 'other-database', content: { data: { source: 'billmanager-local-reminder', serverProfileId: 'server-a', databaseId: 'work' } } },
    ]);

    await scheduleLocalBillReminders([bill], {
      scope: { serverProfileId: 'server-a', databaseId: 'home' },
      now: new Date(2026, 6, 15, 9),
    });

    expect(mocks.cancelScheduled).toHaveBeenCalledTimes(1);
    expect(mocks.cancelScheduled).toHaveBeenCalledWith('same');
    expect(mocks.schedule).toHaveBeenCalledWith(expect.objectContaining({
      identifier: expect.stringMatching(/^server-a:home:bill-41-/),
      content: expect.objectContaining({
        data: expect.objectContaining({
          billId: 41,
          serverProfileId: 'server-a',
          databaseId: 'home',
        }),
      }),
    }));
  });

  it('passes the notification scope to Mark Paid and ignores legacy unscoped actions', async () => {
    let listener: ((response: any) => Promise<void>) | undefined;
    mocks.addResponseListener.mockImplementation((callback) => {
      listener = callback;
      return { remove: vi.fn() };
    });
    const onMarkPaid = vi.fn();
    subscribeToNotificationActions({ onOpenBill: vi.fn(), onMarkPaid });

    await listener?.({
      actionIdentifier: NOTIFICATION_ACTIONS.markPaid,
      notification: { request: { content: { data: { billId: 41 } } } },
    });
    await listener?.({
      actionIdentifier: NOTIFICATION_ACTIONS.markPaid,
      notification: { request: { content: { data: { billId: 41, serverProfileId: 'server-a', databaseId: 'home' } } } },
    });

    expect(onMarkPaid).toHaveBeenCalledTimes(1);
    expect(onMarkPaid).toHaveBeenCalledWith(41, { serverProfileId: 'server-a', databaseId: 'home' });
  });
});
