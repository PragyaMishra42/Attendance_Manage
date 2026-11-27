import { SyncStatus } from "./database";

export type AttendanceStatus = "present" | "absent" | "late" | "unverified";
export type IdentificationMethod = "ai_assisted" | "manual";
export type VerificationStatus = "verified" | "pending_review" | "overridden";

export interface AttendanceSession {
  id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  session_date: string;
  session_label: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string; // UUID
  session_id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  roll_number: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  session_date: string;
  session_label: string;
  status: AttendanceStatus;
  identification_method: IdentificationMethod;
  verification_status: VerificationStatus;
  confidence_score?: number; // 0 to 100
  recorded_by: string;
  teacher_name: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface DetectedFaceMatch {
  face_id: string;
  bounding_box: { x: number; y: number; width: number; height: number };
  matched_student_id: string | null;
  confidence_score: number;
  is_mock: boolean;
}

export interface IdentificationResult {
  provider_name: string;
  is_mock: boolean;
  processed_at: string;
  total_faces_detected: number;
  matches: DetectedFaceMatch[];
  unidentified_face_ids: string[];
}
