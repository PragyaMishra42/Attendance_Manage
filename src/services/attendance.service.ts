import { localDb } from "@/lib/db/dexie";
import {
  MOCK_ATTENDANCE_RECORDS,
  MOCK_CLASSES,
  MOCK_SECTIONS,
  MOCK_STUDENTS,
  MOCK_SUBJECTS,
  MOCK_SYNC_LOGS,
} from "@/lib/mock-data";
import { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { generateUUID } from "@/lib/utils/cn";

let seedPromise: Promise<void> | null = null;

export async function ensureLocalSeedData(): Promise<void> {
  if (!localDb) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      const studentCount = await localDb.students.count();
      if (studentCount === 0) {
        await localDb.classes.bulkPut(MOCK_CLASSES);
        await localDb.sections.bulkPut(MOCK_SECTIONS);
        await localDb.subjects.bulkPut(MOCK_SUBJECTS);
        await localDb.students.bulkPut(MOCK_STUDENTS);
      }
      const attendanceCount = await localDb.attendance.count();
      if (attendanceCount === 0) {
        await localDb.attendance.bulkPut(MOCK_ATTENDANCE_RECORDS);
      }
      const logCount = await localDb.syncLogs.count();
      if (logCount === 0) {
        await localDb.syncLogs.bulkPut(MOCK_SYNC_LOGS);
      }
    })();
  }
  return seedPromise;
}

export const attendanceService = {
  async getAllRecords(): Promise<AttendanceRecord[]> {
    if (!localDb) return MOCK_ATTENDANCE_RECORDS;
    await ensureLocalSeedData();
    return localDb.attendance.orderBy("session_date").reverse().toArray();
  },

  async getByStudentId(studentId: string): Promise<AttendanceRecord[]> {
    if (!localDb) {
      return MOCK_ATTENDANCE_RECORDS.filter((r) => r.student_id === studentId);
    }
    await ensureLocalSeedData();
    return localDb.attendance.where("student_id").equals(studentId).toArray();
  },

  async saveSessionAttendance(
    records: Omit<AttendanceRecord, "id" | "created_at" | "updated_at" | "sync_status">[],
    isOnline: boolean
  ): Promise<AttendanceRecord[]> {
    const now = new Date().toISOString();
    const prepared: AttendanceRecord[] = records.map((item) => ({
      ...item,
      id: generateUUID(),
      sync_status: isOnline ? "pending" : "pending",
      created_at: now,
      updated_at: now,
    }));

    if (localDb) {
      await ensureLocalSeedData();
      await localDb.attendance.bulkPut(prepared);
      await localDb.syncLogs.bulkPut(
        prepared.map((rec) => ({
          id: generateUUID(),
          record_id: rec.id,
          sync_status: "pending",
          synced_at: now,
          details: isOnline
            ? `Saved locally for ${rec.student_name}; queued for sync`
            : `Saved offline for ${rec.student_name}`,
        }))
      );
    }

    return prepared;
  },

  async updateAttendanceStatus(
    id: string,
    status: AttendanceStatus,
    isOnline: boolean
  ): Promise<void> {
    if (!localDb) return;
    await localDb.attendance.update(id, {
      status,
      verification_status: "overridden",
      sync_status: isOnline ? "pending" : "pending",
      updated_at: new Date().toISOString(),
    });
  },
};
