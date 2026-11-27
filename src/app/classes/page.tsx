"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Camera, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  MOCK_CLASSES,
  MOCK_SECTIONS,
  MOCK_STUDENTS,
  MOCK_SUBJECTS,
  MOCK_TEACHER_CLASSES,
} from "@/lib/mock-data";

export default function ClassesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes &amp; Subjects</h1>
          <p className="text-sm text-slate-500">
            Assigned classes, sections, schedules, and enrolled student counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_TEACHER_CLASSES.map((tc) => {
            const cls = MOCK_CLASSES.find((c) => c.id === tc.class_id);
            const sec = MOCK_SECTIONS.find((s) => s.id === tc.section_id);
            const sub = MOCK_SUBJECTS.find((s) => s.id === tc.subject_id);
            const studentCount = MOCK_STUDENTS.filter(
              (s) => s.class_id === tc.class_id && s.section_id === tc.section_id
            ).length;

            return (
              <div
                key={tc.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      <BookOpen className="h-3.5 w-3.5" />
                      {sub?.subject_code}
                    </span>
                    <span className="text-xs text-slate-500">{tc.room_number}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-slate-900">
                    {cls?.class_name} - Section {sec?.section_name}
                  </h2>
                  <p className="text-sm font-medium text-slate-600">{sub?.subject_name}</p>
                  <p className="mt-2 text-xs text-slate-500">{tc.schedule_time}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    {studentCount} Students
                  </span>
                  <Link
                    href={`/attendance?classId=${tc.class_id}&sectionId=${tc.section_id}&subjectId=${tc.subject_id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take Attendance
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
