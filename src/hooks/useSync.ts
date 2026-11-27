"use client";

import { useCallback, useEffect, useState } from "react";
import { syncService, SyncSummary } from "@/services/sync.service";

export function useSync(isOnline: boolean) {
  const [summary, setSummary] = useState<SyncSummary>({
    pendingCount: 0,
    failedCount: 0,
    syncedCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
  });

  const refresh = useCallback(async () => {
    const next = await syncService.getSummary();
    setSummary(next);
  }, []);

  useEffect(() => {
    let active = true;
    syncService.getSummary().then((next) => {
      if (active) setSummary(next);
    });
    const unsub = syncService.subscribe(() => {
      syncService.getSummary().then((next) => {
        if (active) setSummary(next);
      });
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Automatic sync on reconnection or app startup when online
  useEffect(() => {
    if (isOnline && (summary.pendingCount > 0 || summary.failedCount > 0) && !summary.isSyncing) {
      const timer = setTimeout(() => {
        syncService.syncPendingRecords(isOnline).then(() => refresh());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOnline, summary.pendingCount, summary.failedCount, summary.isSyncing, refresh]);

  const syncNow = useCallback(async () => {
    const res = await syncService.syncPendingRecords(isOnline);
    await refresh();
    return res;
  }, [isOnline, refresh]);

  return {
    ...summary,
    waitingCount: summary.pendingCount + summary.failedCount,
    syncNow,
    refresh,
  };
}
