export type UserRole = "teacher" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  class_name: string;
  grade_level: number;
  created_at: string;
}

export interface Section {
  id: string;
  section_name: string;
  class_id: string;
}

export interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
}

export interface TeacherClassAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  schedule_time?: string;
  room_number?: string;
}

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface SyncLog {
  id: string;
  record_id: string;
  sync_status: SyncStatus;
  error_message?: string | null;
  synced_at: string;
  details?: string;
}
