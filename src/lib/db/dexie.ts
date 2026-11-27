import Dexie, { type EntityTable } from "dexie";
import { AttendanceRecord } from "@/types/attendance";
import { Student } from "@/types/student";
import { SchoolClass, Section, Subject, SyncLog } from "@/types/database";

export class SmartAttendDatabase extends Dexie {
  students!: EntityTable<Student, "id">;
  attendance!: EntityTable<AttendanceRecord, "id">;
  classes!: EntityTable<SchoolClass, "id">;
  sections!: EntityTable<Section, "id">;
  subjects!: EntityTable<Subject, "id">;
  syncLogs!: EntityTable<SyncLog, "id">;

  constructor() {
    super("smartattend_offline_db");
    this.version(1).stores({
      students: "id, student_code, class_id, section_id, roll_number, full_name",
      attendance:
        "id, session_id, student_id, class_id, section_id, subject_id, session_date, sync_status, [session_id+student_id]",
      classes: "id, class_name",
      sections: "id, class_id, section_name",
      subjects: "id, class_id, subject_name",
      syncLogs: "id, record_id, sync_status, synced_at",
    });
  }
}

export const localDb =
  typeof window !== "undefined" ? new SmartAttendDatabase() : null;
