import { Platform } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

export const BACKGROUND_SYNC_TASK = 'billmanager-background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // A task can start in a fresh JavaScript process, so it must not depend on
    // a React provider having installed an in-memory callback.
    const { runHeadlessBackgroundSync } = await import('../services/headlessBackgroundSync');
    const result = await runHeadlessBackgroundSync();
    if (result.scopesFailed > 0 && result.scopesSucceeded === 0) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, { minimumInterval: 60 });
  return true;
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (Platform.OS !== 'web') await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}
