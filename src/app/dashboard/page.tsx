"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Users,
  ClipboardList,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useOffline } from "@/hooks/useOffline";
import { useSync } from "@/hooks/useSync";
import { attendanceService } from "@/services/attendance.service";
import { studentService } from "@/services/student.service";
import {
  MOCK_CLASSES,
  MOCK_SECTIONS,
  MOCK_SUBJECTS,
  MOCK_TEACHER_CLASSES,
} from "@/lib/mock-data";
import { AttendanceRecord } from "@/types/attendance";
import { Student } from "@/types/student";
import { AttendanceStatusBadge, SyncStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const WEEKLY_OVERVIEW = [
  { day: "Mon", present: 92, absent: 5, late: 3 },
  { day: "Tue", present: 89, absent: 7, late: 4 },
  { day: "Wed", present: 94, absent: 4, late: 2 },
  { day: "Thu", present: 91, absent: 6, late: 3 },
  { day: "Fri", present: 88, absent: 8, late: 4 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { isOnline, isOffline } = useOffline();
  const { waitingCount, isSyncing, syncNow } = useSync(isOnline);
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([attendanceService.getAllRecords(), studentService.getAll()]).then(
      ([att, stu]) => {
        if (!active) return;
        setRecords(att);
        setStudents(stu);
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const assignedClasses =
    user?.role === "admin"
      ? MOCK_TEACHER_CLASSES
      : MOCK_TEACHER_CLASSES.filter((tc) => tc.teacher_id === user?.id);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysRecords = records.filter((r) => r.session_date === todayStr);
  const uniqueSessionsToday = new Set(todaysRecords.map((r) => r.session_id)).size;

  const presentOrLate = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const completionPct =
    records.length > 0 ? Math.round((presentOrLate / records.length) * 100) : 0;

  const pendingRecords = records.filter(
    (r) => r.sync_status === "pending" || r.sync_status === "failed"
  );

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSyncClick = async () => {
    if (isOffline) {
      showToast({
        variant: "warning",
        title: "Device is offline",
        description: "Pending records will sync automatically once internet returns.",
      });
      return;
    }
    const res = await syncNow();
    const updated = await attendanceService.getAllRecords();
    setRecords(updated);
    showToast({
      variant: "success",
      title: `Synchronized ${res.synced} record(s)`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.full_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user?.department ?? "Faculty"} &middot;{" "}
              {user?.role === "admin" ? "School Administrator" : "Class Teacher"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Take Attendance
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              View Reports
            </Link>
          </div>
        </div>

        {/* Summary KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Assigned Students</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{students.length}</p>
              <p className="mt-1 text-xs text-slate-500">Active roster</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Assigned Classes</span>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{assignedClasses.length}</p>
              <p className="mt-1 text-xs text-slate-500">Sections &amp; subjects</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Today&apos;s Sessions</span>
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueSessionsToday}</p>
              <p className="mt-1 text-xs text-slate-500">
                {todaysRecords.length} student entries
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Attendance Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{completionPct}%</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Present &amp; late</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Sync</span>
                <RefreshCw className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{waitingCount}</p>
              <p className="mt-1 text-xs text-slate-500">Waiting in IndexedDB</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Network Status</span>
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {isOnline ? "Online" : "Offline"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isOnline ? "Cloud sync ready" : "Local storage active"}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Take Attendance",
              desc: "Capture photo & verify",
              href: "/attendance",
              icon: Camera,
              accent: "bg-indigo-50 text-indigo-600",
            },
            {
              title: "View Students",
              desc: "Manage class rosters",
              href: "/students",
              icon: Users,
              accent: "bg-blue-50 text-blue-600",
            },
            {
              title: "Attendance History",
              desc: "Search & export CSV",
              href: "/attendance/history",
              icon: ClipboardList,
              accent: "bg-emerald-50 text-emerald-600",
            },
            {
              title: "View Reports",
              desc: "Trends & analytics",
              href: "/reports",
              icon: BarChart3,
              accent: "bg-amber-50 text-amber-600",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Main Grid: Today's Classes + Attendance Overview Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Classes */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Today&apos;s Classes</h2>
              <Link
                href="/classes"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {assignedClasses.map((tc) => {
                const cls = MOCK_CLASSES.find((c) => c.id === tc.class_id);
                const sec = MOCK_SECTIONS.find((s) => s.id === tc.section_id);
                const sub = MOCK_SUBJECTS.find((s) => s.id === tc.subject_id);
                return (
                  <div
                    key={tc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {cls?.class_name} - Section {sec?.section_name} &middot; {sub?.subject_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {tc.schedule_time} &middot; {tc.room_number}
                      </p>
                    </div>
                    <Link
                      href={`/attendance?classId=${tc.class_id}&sectionId=${tc.section_id}&subjectId=${tc.subject_id}`}
                      className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      Start
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Overview Chart */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Attendance Overview</h2>
                <p className="text-xs text-slate-500">Weekly attendance percentage breakdown</p>
              </div>
              <Link
                href="/reports"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Full analytics
              </Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_OVERVIEW}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="present" name="Present %" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="late" name="Late %" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" name="Absent %" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Recent Attendance & Pending Sync Records */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Attendance */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent Attendance</h2>
              <Link
                href="/attendance/history"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View history
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Class</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.slice(0, 5).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {rec.student_name}
                        <span className="block text-xs font-normal text-slate-500">
                          {rec.roll_number}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {rec.class_name}-{rec.section_name}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{rec.subject_name}</td>
                      <td className="py-3 pr-4">
                        <AttendanceStatusBadge status={rec.status} />
                      </td>
                      <td className="py-3">
                        <SyncStatusBadge status={rec.sync_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Sync Records */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Pending Sync Records</h2>
                <p className="text-xs text-slate-500">Stored safely in IndexedDB</p>
              </div>
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing || pendingRecords.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Now
              </button>
            </div>

            {pendingRecords.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-slate-900">All records synchronized</p>
                <p className="text-xs text-slate-500 mt-1">
                  No pending or failed records in local queue.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRecords.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {rec.student_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rec.class_name}-{rec.section_name} &middot; {rec.session_date}
                      </p>
                    </div>
                    <SyncStatusBadge status={rec.sync_status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
