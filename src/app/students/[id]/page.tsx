"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { studentService } from "@/services/student.service";
import { attendanceService } from "@/services/attendance.service";
import { Student } from "@/types/student";
import { AttendanceRecord } from "@/types/attendance";
import { AttendanceStatusBadge, SyncStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, getInitials } from "@/lib/utils/cn";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      studentService.getById(params.id),
      attendanceService.getByStudentId(params.id),
    ]).then(([stu, hist]) => {
      setStudent(stu ?? null);
      setHistory(hist);
      setLoading(false);
    });
  }, [params.id]);

  const presentCount = history.filter(
    (h) => h.status === "present" || h.status === "late"
  ).length;
  const attendancePct =
    history.length > 0 ? Math.round((presentCount / history.length) * 100) : 100;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Link>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !student ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-base font-semibold text-slate-900">Student not found</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
                  {getInitials(student.full_name)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
                  <p className="text-sm text-slate-500">
                    {student.student_code} &middot; Roll {student.roll_number} &middot;{" "}
                    {student.class_name} - Section {student.section_name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                    {student.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {student.email}
                      </span>
                    )}
                    {student.parent_contact && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {student.parent_contact}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Enrolled {formatDate(student.enrollment_date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {student.photo_consent ? "Photo Consent Granted" : "Manual Only"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-6 py-4 text-center">
                <p className="text-xs font-medium text-indigo-700">Attendance Rate</p>
                <p className="text-3xl font-bold text-indigo-900 mt-1">{attendancePct}%</p>
                <p className="text-xs text-indigo-600 mt-0.5">{history.length} sessions</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Attendance History
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No attendance records recorded for this student yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Subject</th>
                        <th className="pb-3 pr-4">Session</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Recorded By</th>
                        <th className="pb-3">Sync Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((rec) => (
                        <tr key={rec.id}>
                          <td className="py-3 pr-4 text-slate-700">{rec.session_date}</td>
                          <td className="py-3 pr-4 text-slate-700">{rec.subject_name}</td>
                          <td className="py-3 pr-4 text-slate-500">{rec.session_label}</td>
                          <td className="py-3 pr-4">
                            <AttendanceStatusBadge status={rec.status} />
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{rec.teacher_name}</td>
                          <td className="py-3">
                            <SyncStatusBadge status={rec.sync_status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
