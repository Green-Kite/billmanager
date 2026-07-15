import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { migrateMobileDatabase, mobileDatabaseSchemaVersion } from './database';

describe('mobile database migrations', () => {
  it('creates every profile-scoped offline table in one migration', async () => {
    const statements: string[] = [];
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({ user_version: 0 }),
      execAsync: vi.fn(async (sql: string) => { statements.push(sql); }),
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) => callback()),
    };

    await migrateMobileDatabase(database as never);

    const schema = statements.join('\n');
    for (const table of [
      'server_profiles',
      'bill_groups',
      'bills',
      'payments',
      'reminder_state',
      'analytics_snapshots',
      'auth_sessions',
      'sync_state',
      'outbox',
      'conflicts',
    ]) {
      expect(schema).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(schema).toContain('ALTER TABLE reminder_state ADD COLUMN dismissed_due_date TEXT');
    expect(schema).toContain('PRAGMA user_version = 3');
    expect(mobileDatabaseSchemaVersion).toBe(3);
  });

  it('adds the authenticated session cache when upgrading schema version one', async () => {
    const statements: string[] = [];
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({ user_version: 1 }),
      execAsync: vi.fn(async (sql: string) => { statements.push(sql); }),
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) => callback()),
    };

    await migrateMobileDatabase(database as never);

    const schema = statements.join('\n');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS auth_sessions');
    expect(schema).not.toContain('CREATE TABLE IF NOT EXISTS bills');
    expect(schema).toContain('PRAGMA user_version = 2');
    expect(schema).toContain('PRAGMA user_version = 3');
  });

  it('adds durable reminder dismissal state when upgrading schema version two', async () => {
    const statements: string[] = [];
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({ user_version: 2 }),
      execAsync: vi.fn(async (sql: string) => { statements.push(sql); }),
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) => callback()),
    };

    await migrateMobileDatabase(database as never);

    const schema = statements.join('\n');
    expect(schema).toContain('ALTER TABLE reminder_state ADD COLUMN dismissed_due_date TEXT');
    expect(schema).not.toContain('CREATE TABLE IF NOT EXISTS auth_sessions');
    expect(schema).toContain('PRAGMA user_version = 3');
  });
});
