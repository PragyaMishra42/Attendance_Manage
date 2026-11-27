import { localDb } from "@/lib/db/dexie";
import { ensureLocalSeedData } from "./attendance.service";
import { SyncLog } from "@/types/database";
import { generateUUID } from "@/lib/utils/cn";

export interface SyncSummary {
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

class SyncService {
  private syncing = false;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  async getSummary(): Promise<SyncSummary> {
    if (!localDb) {
      return {
        pendingCount: 2,
        failedCount: 1,
        syncedCount: 4,
        isSyncing: false,
        lastSyncedAt: null,
      };
    }
    await ensureLocalSeedData();
    const all = await localDb.attendance.toArray();
    const pendingCount = all.filter((r) => r.sync_status === "pending").length;
    const failedCount = all.filter((r) => r.sync_status === "failed").length;
    const syncedCount = all.filter((r) => r.sync_status === "synced").length;
    const logs = await localDb.syncLogs.orderBy("synced_at").reverse().limit(1).toArray();

    return {
      pendingCount,
      failedCount,
      syncedCount,
      isSyncing: this.syncing,
      lastSyncedAt: logs[0]?.synced_at ?? null,
    };
  }

  async getSyncLogs(): Promise<SyncLog[]> {
    if (!localDb) return [];
    await ensureLocalSeedData();
    return localDb.syncLogs.orderBy("synced_at").reverse().limit(50).toArray();
  }

  async syncPendingRecords(isOnline: boolean): Promise<{ synced: number; failed: number }> {
    if (!localDb || !isOnline || this.syncing) {
      return { synced: 0, failed: 0 };
    }

    this.syncing = true;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      await ensureLocalSeedData();
      const pending = await localDb.attendance
        .where("sync_status")
        .anyOf("pending", "failed")
        .toArray();

      if (pending.length === 0) {
        return { synced: 0, failed: 0 };
      }

      for (const record of pending) {
        await localDb.attendance.update(record.id, { sync_status: "syncing" });
        // Phase 2 will replace this simulated delay with idempotent Supabase upsert
        await new Promise((resolve) => setTimeout(resolve, 120));

        const now = new Date().toISOString();
        await localDb.attendance.update(record.id, {
          sync_status: "synced",
          updated_at: now,
        });
        await localDb.syncLogs.put({
          id: generateUUID(),
          record_id: record.id,
          sync_status: "synced",
          synced_at: now,
          details: `Synced ${record.student_name} (${record.class_name}-${record.section_name})`,
        });
        synced += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("Sync error:", error);
    } finally {
      this.syncing = false;
      this.notify();
    }

    return { synced, failed };
  }
}

export const syncService = new SyncService();
