"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { attendanceService } from "@/services/attendance.service";
import { AttendanceRecord } from "@/types/attendance";
import { Skeleton } from "@/components/ui/Skeleton";

const WEEKLY_TREND = [
  { week: "Week 1", rate: 91 },
  { week: "Week 2", rate: 89 },
  { week: "Week 3", rate: 93 },
  { week: "Week 4", rate: 94 },
];

const MONTHLY_TREND = [
  { month: "Aug", rate: 88 },
  { month: "Sep", rate: 90 },
  { month: "Oct", rate: 92 },
  { month: "Nov", rate: 93 },
];

const PIE_COLORS = ["#10B981", "#EF4444", "#F59E0B", "#94A3B8"];

export default function ReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getAllRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const unverified = records.filter((r) => r.status === "unverified").length;
    const total = records.length || 1;
    const overallPct = Math.round(((present + late) / total) * 100);

    const byClassMap = new Map<string, { name: string; present: number; absent: number }>();
    records.forEach((r) => {
      const key = `${r.class_name}-${r.section_name}`;
      const curr = byClassMap.get(key) ?? { name: key, present: 0, absent: 0 };
      if (r.status === "present" || r.status === "late") curr.present += 1;
      if (r.status === "absent") curr.absent += 1;
      byClassMap.set(key, curr);
    });

    const studentMap = new Map<
      string,
      { name: string; code: string; classLabel: string; present: number; total: number }
    >();
    records.forEach((r) => {
      const curr = studentMap.get(r.student_id) ?? {
        name: r.student_name,
        code: r.student_code,
        classLabel: `${r.class_name}-${r.section_name}`,
        present: 0,
        total: 0,
      };
      curr.total += 1;
      if (r.status === "present" || r.status === "late") curr.present += 1;
      studentMap.set(r.student_id, curr);
    });

    const lowAttendance = Array.from(studentMap.values())
      .map((s) => ({ ...s, rate: Math.round((s.present / s.total) * 100) }))
      .filter((s) => s.rate < 75);

    return {
      present,
      absent,
      late,
      unverified,
      overallPct,
      classWise: Array.from(byClassMap.values()),
      pieData: [
        { name: "Present", value: present },
        { name: "Absent", value: absent },
        { name: "Late", value: late },
        { name: "Unverified", value: unverified },
      ].filter((d) => d.value > 0),
      lowAttendance,
    };
  }, [records]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500">
            Attendance trends, class-wise breakdown, and early intervention insights.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Overall Attendance</span>
                  <Users className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.overallPct}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Total Present</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.present}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Total Absent</span>
                  <XCircle className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-2 text-3xl font-bold text-rose-700">{stats.absent}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Total Late</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-3xl font-bold text-amber-700">{stats.late}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly & Monthly Trends */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  Weekly Attendance Trend (%)
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={WEEKLY_TREND}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Attendance %"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  Monthly Attendance Trend (%)
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MONTHLY_TREND}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: "#64748B" }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Attendance %"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Class-wise Attendance BarChart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  Class-wise Attendance Count
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.classWise}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="Present/Late" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Breakdown PieChart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  Status Distribution
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label
                      >
                        {stats.pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Students with Low Attendance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Students with Low Attendance (&lt; 75%)
                </h2>
              </div>
              {stats.lowAttendance.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  All tracked students currently meet the 75% attendance threshold.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="pb-3 pr-4">Student ID</th>
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Class</th>
                        <th className="pb-3 pr-4">Attended</th>
                        <th className="pb-3">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.lowAttendance.map((stu) => (
                        <tr key={stu.code}>
                          <td className="py-3 pr-4 font-mono text-xs text-slate-600">{stu.code}</td>
                          <td className="py-3 pr-4 font-semibold text-slate-900">{stu.name}</td>
                          <td className="py-3 pr-4 text-slate-600">{stu.classLabel}</td>
                          <td className="py-3 pr-4 text-slate-600">
                            {stu.present} / {stu.total}
                          </td>
                          <td className="py-3 font-semibold text-rose-600">{stu.rate}%</td>
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
