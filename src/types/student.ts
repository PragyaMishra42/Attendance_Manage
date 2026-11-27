export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  email?: string;
  parent_contact?: string;
  photo_path?: string;
  photo_consent: boolean;
  enrollment_date: string;
  created_at: string;
}

export interface StudentFormValues {
  student_code: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  section_id: string;
  email?: string;
  parent_contact?: string;
  photo_consent: boolean;
  enrollment_date: string;
}
