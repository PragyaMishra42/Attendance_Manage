"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { attendanceService } from "@/services/attendance.service";
import { useOffline } from "@/hooks/useOffline";
import { useToast } from "@/components/ui/Toast";
import { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { MOCK_CLASSES, MOCK_SUBJECTS } from "@/lib/mock-data";
import { AttendanceStatusBadge, SyncStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AttendanceHistoryPage() {
  const { isOnline } = useOffline();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    attendanceService.getAllRecords().then((data) => {
      if (!active) return;
      setRecords(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return records.filter((rec) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        rec.student_name.toLowerCase().includes(q) ||
        rec.student_code.toLowerCase().includes(q) ||
        rec.roll_number.toLowerCase().includes(q);
      const matchesClass = classFilter === "all" || rec.class_id === classFilter;
      const matchesSubject = subjectFilter === "all" || rec.subject_id === subjectFilter;
      const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
      const matchesStart = !startDate || rec.session_date >= startDate;
      const matchesEnd = !endDate || rec.session_date <= endDate;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSubject &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [records, search, classFilter, subjectFilter, statusFilter, startDate, endDate]);

  const handleStatusChange = async (id: string, nextStatus: AttendanceStatus) => {
    await attendanceService.updateAttendanceStatus(id, nextStatus, isOnline);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: nextStatus, sync_status: "pending" } : r
      )
    );
    showToast({
      variant: "success",
      title: "Attendance updated",
      description: "Marked as pending sync.",
    });
  };

  const handleExportCsv = () => {
    const headers = [
      "Date",
      "Student ID",
      "Student Name",
      "Roll Number",
      "Class",
      "Section",
      "Subject",
      "Status",
      "Teacher",
      "Sync Status",
    ];
    const rows = filtered.map((r) => [
      r.session_date,
      r.student_code,
      r.student_name,
      r.roll_number,
      r.class_name,
      r.section_name,
      r.subject_name,
      r.status,
      r.teacher_name,
      r.sync_status,
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartattend-records-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast({
      variant: "success",
      title: "CSV exported",
      description: `Exported ${filtered.length} attendance record(s).`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Records</h1>
            <p className="text-sm text-slate-500">
              Search, filter, audit, and export attendance records across classes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name or ID..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Classes</option>
            {MOCK_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="unverified">Unverified</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="lg:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Subjects</option>
            {MOCK_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subject_name} ({s.subject_code})
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching attendance records"
            description="Try clearing filters or record a new classroom attendance session."
            icon={<ClipboardList className="h-6 w-6" />}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Teacher</th>
                    <th className="py-3.5 px-4">Sync Status</th>
                    <th className="py-3.5 px-4">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {rec.session_date}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {rec.student_code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {rec.student_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rec.class_name}-{rec.section_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.subject_name}</td>
                      <td className="py-3 px-4">
                        <AttendanceStatusBadge status={rec.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.teacher_name}</td>
                      <td className="py-3 px-4">
                        <SyncStatusBadge status={rec.sync_status} />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={rec.status}
                          onChange={(e) =>
                            handleStatusChange(rec.id, e.target.value as AttendanceStatus)
                          }
                          aria-label={`Edit status for ${rec.student_name}`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="unverified">Unverified</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
