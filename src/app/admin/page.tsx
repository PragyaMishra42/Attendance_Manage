"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  RefreshCw,
  UserPlus,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { syncService } from "@/services/sync.service";
import { studentService } from "@/services/student.service";
import {
  MOCK_CLASSES,
  MOCK_PROFILES,
  MOCK_SECTIONS,
  MOCK_SUBJECTS,
  MOCK_TEACHER_CLASSES,
} from "@/lib/mock-data";
import { SyncLog, TeacherClassAssignment } from "@/types/database";
import { Student } from "@/types/student";
import { SyncStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

type AdminTab = "teachers" | "academics" | "sync" | "privacy";

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>("teachers");
  const [assignments, setAssignments] =
    useState<TeacherClassAssignment[]>(MOCK_TEACHER_CLASSES);
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [sections, setSections] = useState(MOCK_SECTIONS);
  const [subjects, setSubjects] = useState(MOCK_SUBJECTS);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [newClassName, setNewClassName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("teacher-1");
  const [assignClassId, setAssignClassId] = useState("cls-10");
  const [assignSectionId, setAssignSectionId] = useState("sec-10a");
  const [assignSubjectId, setAssignSubjectId] = useState("sub-math-10");

  useEffect(() => {
    syncService.getSyncLogs().then(setSyncLogs);
    studentService.getAll().then(setStudents);
  }, []);

  if (user && user.role !== "admin") {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto mt-10 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Administrator Access Required</h1>
          <p className="text-sm text-slate-500">
            This console is restricted to school administrators. Sign in with an Administrator
            account to manage school-wide classes, teachers, and sync logs.
          </p>
        </div>
      </AppShell>
    );
  }

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignments((prev) => [
      ...prev,
      {
        id: `tc-${Date.now()}`,
        teacher_id: assignTeacherId,
        class_id: assignClassId,
        section_id: assignSectionId,
        subject_id: assignSubjectId,
        schedule_time: "09:00 AM - 09:50 AM",
        room_number: "Room 101",
      },
    ]);
    showToast({ variant: "success", title: "Teacher assigned to class" });
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const id = `cls-${Date.now()}`;
    setClasses((prev) => [
      ...prev,
      {
        id,
        class_name: newClassName.trim(),
        grade_level: prev.length + 9,
        created_at: new Date().toISOString(),
      },
    ]);
    setSections((prev) => [
      ...prev,
      { id: `sec-${Date.now()}`, section_name: "A", class_id: id },
    ]);
    setNewClassName("");
    showToast({ variant: "success", title: "Class created with Section A" });
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;
    setSubjects((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        subject_name: newSubjectName.trim(),
        subject_code: newSubjectCode.trim().toUpperCase(),
        class_id: assignClassId,
      },
    ]);
    setNewSubjectName("");
    setNewSubjectCode("");
    showToast({ variant: "success", title: "Subject added" });
  };

  const toggleConsent = async (student: Student) => {
    await studentService.update(student.id, { photo_consent: !student.photo_consent });
    const updated = await studentService.getAll();
    setStudents(updated);
    showToast({
      variant: "info",
      title: `Updated photo consent for ${student.full_name}`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Console</h1>
          <p className="text-sm text-slate-500">
            Manage teachers, classes, subjects, student photo authorizations, and sync logs.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "teachers" as const, label: "Teachers & Assignments", icon: Users },
            { id: "academics" as const, label: "Classes & Subjects", icon: BookOpen },
            { id: "sync" as const, label: "Synchronization Logs", icon: RefreshCw },
            { id: "privacy" as const, label: "Photo Authorizations", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                  tab === item.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "teachers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-600" />
                Assign Teacher to Class
              </h2>
              <form onSubmit={handleAssignTeacher} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teacher</label>
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {MOCK_PROFILES.filter((p) => p.role === "teacher").map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                    <select
                      value={assignClassId}
                      onChange={(e) => setAssignClassId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                    <select
                      value={assignSectionId}
                      onChange={(e) => setAssignSectionId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          Section {s.section_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subject_name} ({sub.subject_code})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Assign Class
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Active Teacher Assignments
              </h2>
              <div className="space-y-2.5">
                {assignments.map((a) => {
                  const teacher = MOCK_PROFILES.find((p) => p.id === a.teacher_id);
                  const cls = classes.find((c) => c.id === a.class_id);
                  const sec = sections.find((s) => s.id === a.section_id);
                  const sub = subjects.find((s) => s.id === a.subject_id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{teacher?.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {cls?.class_name}-{sec?.section_name} &middot; {sub?.subject_name}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{a.room_number}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "academics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Manage Classes</h2>
              <form onSubmit={handleAddClass} className="flex gap-2">
                <input
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Grade 12"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Add Class
                </button>
              </form>
              <div className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{c.class_name}</span>
                    <span className="text-xs text-slate-500">
                      {sections.filter((s) => s.class_id === c.id).length} section(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Manage Subjects</h2>
              <form onSubmit={handleAddSubject} className="grid grid-cols-3 gap-2">
                <input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name"
                  className="col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="Code"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="col-span-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Add Subject
                </button>
              </form>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {subjects.map((sub) => (
                  <div key={sub.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{sub.subject_name}</span>
                    <span className="font-mono text-xs text-slate-500">{sub.subject_code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "sync" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Synchronization Audit Logs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="pb-3 pr-4">Timestamp</th>
                    <th className="pb-3 pr-4">Record ID</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Details</th>
                    <th className="pb-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 pr-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.synced_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                        {log.record_id.slice(0, 12)}...
                      </td>
                      <td className="py-3 pr-4">
                        <SyncStatusBadge status={log.sync_status} />
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{log.details || "—"}</td>
                      <td className="py-3 text-xs text-rose-600">
                        {log.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "privacy" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Authorized Student Photographs &amp; Consent
            </h2>
            <div className="divide-y divide-slate-100">
              {students.map((stu) => (
                <div
                  key={stu.id}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{stu.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {stu.student_code} &middot; {stu.class_name}-{stu.section_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleConsent(stu)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors",
                      stu.photo_consent
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {stu.photo_consent ? "Consent Active" : "Manual Only"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
