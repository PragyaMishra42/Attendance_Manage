"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Users,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { studentService } from "@/services/student.service";
import { MOCK_CLASSES, MOCK_SECTIONS } from "@/lib/mock-data";
import { Student } from "@/types/student";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getInitials } from "@/lib/utils/cn";

const studentSchema = z.object({
  student_code: z.string().min(3, "Student ID is required"),
  full_name: z.string().min(2, "Full name is required"),
  roll_number: z.string().min(1, "Roll number is required"),
  class_id: z.string().min(1, "Class is required"),
  section_id: z.string().min(1, "Section is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  parent_contact: z.string().optional(),
  photo_consent: z.boolean(),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
});

type StudentFormData = z.infer<typeof studentSchema>;

const PAGE_SIZE = 8;

export default function StudentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      class_id: "cls-10",
      section_id: "sec-10a",
      photo_consent: true,
      enrollment_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedClassId = watch("class_id");
  const modalSections = useMemo(
    () => MOCK_SECTIONS.filter((s) => s.class_id === watchedClassId),
    [watchedClassId]
  );

  const loadStudents = async () => {
    setLoading(true);
    const data = await studentService.getAll();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q);
      const matchesClass = classFilter === "all" || s.class_id === classFilter;
      const matchesSection = sectionFilter === "all" || s.section_name === sectionFilter;
      return matchesQuery && matchesClass && matchesSection;
    });
  }, [students, search, classFilter, sectionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAddModal = () => {
    setEditingStudent(null);
    setPhotoPreview(undefined);
    reset({
      student_code: `SA-2026-${String(students.length + 1).padStart(3, "0")}`,
      full_name: "",
      roll_number: "",
      class_id: "cls-10",
      section_id: "sec-10a",
      email: "",
      parent_contact: "",
      photo_consent: true,
      enrollment_date: new Date().toISOString().split("T")[0],
    });
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setPhotoPreview(student.photo_path);
    reset({
      student_code: student.student_code,
      full_name: student.full_name,
      roll_number: student.roll_number,
      class_id: student.class_id,
      section_id: student.section_id,
      email: student.email ?? "",
      parent_contact: student.parent_contact ?? "",
      photo_consent: student.photo_consent,
      enrollment_date: student.enrollment_date,
    });
    setModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: StudentFormData) => {
    if (editingStudent) {
      await studentService.update(editingStudent.id, data, photoPreview);
      showToast({ variant: "success", title: "Student updated" });
    } else {
      await studentService.create(data, photoPreview);
      showToast({ variant: "success", title: "Student added to roster" });
    }
    setModalOpen(false);
    await loadStudents();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await studentService.remove(deleteTarget.id);
    showToast({ variant: "info", title: `Removed ${deleteTarget.full_name}` });
    setDeleteTarget(null);
    await loadStudents();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
            <p className="text-sm text-slate-500">
              Manage student rosters, guardian photo consent, and reference profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, student ID, or roll number..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Classes</option>
            {MOCK_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : paginated.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try adjusting your search or class filters, or add a new student."
            icon={<Users className="h-6 w-6" />}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Roll No</th>
                    <th className="py-3.5 px-4">Class &amp; Section</th>
                    <th className="py-3.5 px-4">Photo Consent</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {student.photo_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={student.photo_path}
                              alt={student.full_name}
                              className="h-9 w-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {getInitials(student.full_name)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{student.full_name}</p>
                            <p className="text-xs text-slate-500">{student.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {student.student_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{student.roll_number}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {student.class_name} - {student.section_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {student.photo_consent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> Consented
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Manual Only
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/students/${student.id}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="View profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="Edit student"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} students
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? "Edit Student" : "Add New Student"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Student ID</label>
                  <input
                    {...register("student_code")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  {errors.student_code && (
                    <p className="text-xs text-rose-600 mt-1">{errors.student_code.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Roll Number</label>
                  <input
                    {...register("roll_number")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  {errors.roll_number && (
                    <p className="text-xs text-rose-600 mt-1">{errors.roll_number.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  {...register("full_name")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                {errors.full_name && (
                  <p className="text-xs text-rose-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                  <select
                    {...register("class_id")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {MOCK_CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                  <select
                    {...register("section_id")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {modalSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.section_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Parent Contact (Optional)
                  </label>
                  <input
                    {...register("parent_contact")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    {...register("enrollment_date")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reference Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("photo_consent")}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Parent/guardian authorization obtained for reference photo identification
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingStudent ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Student"
        description={`Are you sure you want to remove ${deleteTarget?.full_name} (${deleteTarget?.student_code}) from the roster?`}
        confirmLabel="Delete Student"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
