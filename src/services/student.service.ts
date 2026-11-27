import { localDb } from "@/lib/db/dexie";
import { ensureLocalSeedData } from "./attendance.service";
import { MOCK_CLASSES, MOCK_SECTIONS, MOCK_STUDENTS } from "@/lib/mock-data";
import { Student, StudentFormValues } from "@/types/student";
import { generateUUID } from "@/lib/utils/cn";

export const studentService = {
  async getAll(): Promise<Student[]> {
    if (!localDb) return MOCK_STUDENTS;
    await ensureLocalSeedData();
    return localDb.students.orderBy("roll_number").toArray();
  },

  async getById(id: string): Promise<Student | undefined> {
    if (!localDb) return MOCK_STUDENTS.find((s) => s.id === id);
    await ensureLocalSeedData();
    return localDb.students.get(id);
  },

  async getByClassAndSection(classId: string, sectionId: string): Promise<Student[]> {
    const all = await this.getAll();
    return all.filter((s) => s.class_id === classId && s.section_id === sectionId);
  },

  async create(values: StudentFormValues, photoPath?: string): Promise<Student> {
    const cls = MOCK_CLASSES.find((c) => c.id === values.class_id);
    const sec = MOCK_SECTIONS.find((s) => s.id === values.section_id);
    const student: Student = {
      id: generateUUID(),
      student_code: values.student_code,
      full_name: values.full_name,
      roll_number: values.roll_number,
      class_id: values.class_id,
      class_name: cls?.class_name ?? "Grade 10",
      section_id: values.section_id,
      section_name: sec?.section_name ?? "A",
      email: values.email,
      parent_contact: values.parent_contact,
      photo_path: photoPath,
      photo_consent: values.photo_consent,
      enrollment_date: values.enrollment_date,
      created_at: new Date().toISOString(),
    };
    if (localDb) {
      await ensureLocalSeedData();
      await localDb.students.put(student);
    }
    return student;
  },

  async update(id: string, values: Partial<StudentFormValues>, photoPath?: string): Promise<void> {
    if (!localDb) return;
    const cls = values.class_id ? MOCK_CLASSES.find((c) => c.id === values.class_id) : undefined;
    const sec = values.section_id ? MOCK_SECTIONS.find((s) => s.id === values.section_id) : undefined;
    await localDb.students.update(id, {
      ...values,
      ...(cls ? { class_name: cls.class_name } : {}),
      ...(sec ? { section_name: sec.section_name } : {}),
      ...(photoPath !== undefined ? { photo_path: photoPath } : {}),
    });
  },

  async remove(id: string): Promise<void> {
    if (!localDb) return;
    await localDb.students.delete(id);
  },
};
