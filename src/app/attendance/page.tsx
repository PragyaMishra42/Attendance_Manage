"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Sparkles,
  SwitchCamera,
  UserCheck,
  AlertTriangle,
  Upload,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useCamera } from "@/hooks/useCamera";
import { useOffline } from "@/hooks/useOffline";
import { useSync } from "@/hooks/useSync";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AttendanceStatusBadge } from "@/components/ui/Badge";
import { studentService } from "@/services/student.service";
import { identificationService } from "@/services/identification.service";
import { attendanceService } from "@/services/attendance.service";
import { MOCK_CLASSES, MOCK_SECTIONS, MOCK_SUBJECTS } from "@/lib/mock-data";
import { Student } from "@/types/student";
import {
  AttendanceStatus,
  IdentificationMethod,
  IdentificationResult,
  VerificationStatus,
} from "@/types/attendance";
import { cn, generateUUID, getInitials } from "@/lib/utils/cn";

interface VerificationRow {
  student: Student;
  status: AttendanceStatus;
  identification_method: IdentificationMethod;
  verification_status: VerificationStatus;
  confidence_score?: number;
  ai_matched: boolean;
}

const STEPS = [
  { id: 1, label: "Select Class" },
  { id: 2, label: "Camera Capture" },
  { id: 3, label: "AI Identification" },
  { id: 4, label: "Verify Attendance" },
  { id: 5, label: "Saved" },
];

const SAMPLE_CLASSROOM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#E2E8F0"/>
    <rect x="40" y="30" width="720" height="390" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
    <text x="400" y="75" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#334155">Sample Classroom Capture (Demo)</text>
    <circle cx="170" cy="185" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="320" cy="185" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="470" cy="185" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="620" cy="185" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="245" cy="315" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="400" cy="315" r="42" fill="#C7D2FE" stroke="#4F46E5" stroke-width="3"/>
    <circle cx="555" cy="315" r="42" fill="#FDE68A" stroke="#D97706" stroke-width="3" stroke-dasharray="6 4"/>
    <text x="555" y="378" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#B45309">Unidentified Face</text>
  </svg>`
)}`;

function AttendanceWorkflowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { syncNow } = useSync(isOnline);
  const { showToast } = useToast();
  const {
    videoRef,
    isStreaming,
    capturedImage,
    setCapturedImage,
    error: cameraError,
    startCamera,
    capturePhoto,
    retakePhoto,
    switchCamera,
  } = useCamera();

  const [step, setStep] = useState<number>(1);
  const [classId, setClassId] = useState(searchParams.get("classId") || "cls-10");
  const [sectionId, setSectionId] = useState(searchParams.get("sectionId") || "sec-10a");
  const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") || "sub-math-10");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sessionLabel, setSessionLabel] = useState("Morning Period 1");

  const [roster, setRoster] = useState<Student[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<IdentificationResult | null>(null);
  const [unidentifiedAssignments, setUnidentifiedAssignments] = useState<
    Record<string, string>
  >({});
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{
    sessionId: string;
    total: number;
    synced: boolean;
  } | null>(null);

  const filteredSections = useMemo(
    () => MOCK_SECTIONS.filter((s) => s.class_id === classId),
    [classId]
  );
  const filteredSubjects = useMemo(
    () => MOCK_SUBJECTS.filter((s) => s.class_id === classId),
    [classId]
  );

  const handleClassChange = (nextClassId: string) => {
    setClassId(nextClassId);
    const nextSections = MOCK_SECTIONS.filter((s) => s.class_id === nextClassId);
    const nextSubjects = MOCK_SUBJECTS.filter((s) => s.class_id === nextClassId);
    if (nextSections[0]) setSectionId(nextSections[0].id);
    if (nextSubjects[0]) setSubjectId(nextSubjects[0].id);
  };

  useEffect(() => {
    studentService.getByClassAndSection(classId, sectionId).then(setRoster);
  }, [classId, sectionId]);

  const buildRowsFromAi = (result: IdentificationResult | null, students: Student[]) => {
    const matchMap = new Map<string, number>();
    result?.matches.forEach((m) => {
      if (m.matched_student_id) {
        matchMap.set(m.matched_student_id, m.confidence_score);
      }
    });

    setRows(
      students.map((student) => {
        const score = matchMap.get(student.id);
        return {
          student,
          // Never automatically mark final attendance purely from AI without teacher review
          status: score ? "present" : "unverified",
          identification_method: score ? "ai_assisted" : "manual",
          verification_status: score ? "pending_review" : "pending_review",
          confidence_score: score,
          ai_matched: Boolean(score),
        };
      })
    );
  };

  const handleRunIdentification = async () => {
    if (!capturedImage) return;
    setStep(3);
    setAiLoading(true);
    try {
      const result = await identificationService.identifyFromCapture(
        capturedImage,
        roster
      );
      setAiResult(result);
      buildRowsFromAi(result, roster);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSkipToManual = () => {
    setAiResult(null);
    buildRowsFromAi(null, roster);
    setStep(4);
  };

  const handleAssignUnidentified = (faceId: string, studentId: string) => {
    setUnidentifiedAssignments((prev) => ({ ...prev, [faceId]: studentId }));
    if (!studentId) return;
    setRows((prev) =>
      prev.map((row) =>
        row.student.id === studentId
          ? {
              ...row,
              status: "present",
              identification_method: "manual",
              verification_status: "verified",
            }
          : row
      )
    );
  };

  const updateRowStatus = (studentId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) =>
        r.student.id === studentId
          ? {
              ...r,
              status,
              verification_status: r.ai_matched ? "overridden" : "verified",
            }
          : r
      )
    );
  };

  const markAllStatus = (status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        status,
        verification_status: "verified",
      }))
    );
  };

  const handleConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const sessionId = generateUUID();
      const cls = MOCK_CLASSES.find((c) => c.id === classId);
      const sec = MOCK_SECTIONS.find((s) => s.id === sectionId);
      const sub = MOCK_SUBJECTS.find((s) => s.id === subjectId);

      await attendanceService.saveSessionAttendance(
        rows.map((r) => ({
          session_id: sessionId,
          student_id: r.student.id,
          student_code: r.student.student_code,
          student_name: r.student.full_name,
          roll_number: r.student.roll_number,
          class_id: classId,
          class_name: cls?.class_name ?? "Grade 10",
          section_id: sectionId,
          section_name: sec?.section_name ?? "A",
          subject_id: subjectId,
          subject_name: sub?.subject_name ?? "Mathematics",
          session_date: sessionDate,
          session_label: sessionLabel,
          status: r.status,
          identification_method: r.identification_method,
          verification_status: "verified",
          confidence_score: r.confidence_score,
          recorded_by: user?.id ?? "teacher-1",
          teacher_name: user?.full_name ?? "Teacher",
        })),
        isOnline
      );

      let syncedNow = false;
      if (isOnline) {
        const res = await syncNow();
        syncedNow = res.synced > 0;
      }

      setSavedSummary({
        sessionId,
        total: rows.length,
        synced: syncedNow,
      });
      setStep(5);
      showToast({
        variant: "success",
        title: isOnline ? "Attendance saved & synced" : "Attendance saved locally",
        description: isOnline
          ? `${rows.length} student records saved and synchronized.`
          : `${rows.length} student records stored in IndexedDB for automatic sync.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = MOCK_CLASSES.find((c) => c.id === classId);
  const selectedSection = MOCK_SECTIONS.find((s) => s.id === sectionId);
  const selectedSubject = MOCK_SUBJECTS.find((s) => s.id === subjectId);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Take Attendance</h1>
            <p className="text-sm text-slate-500">
              Capture classroom photo, review AI-assisted matches, and confirm final attendance.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between min-w-[540px]">
            {STEPS.map((item, idx) => {
              const active = step === item.id;
              const completed = step > item.id;
              return (
                <React.Fragment key={item.id}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        completed && "bg-emerald-600 text-white",
                        active && "bg-indigo-600 text-white",
                        !active && !completed && "bg-slate-100 text-slate-500"
                      )}
                    >
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : item.id}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        active ? "text-indigo-700" : completed ? "text-slate-800" : "text-slate-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* STEP 1: SELECT CLASS */}
        {step === 1 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Step 1: Select Class &amp; Session
              </h2>
              <p className="text-sm text-slate-500">
                Choose the class, section, subject, and session for this attendance roll call.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {MOCK_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.section_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_name} ({sub.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Attendance Session
                </label>
                <select
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option>Morning Period 1</option>
                  <option>Morning Period 2</option>
                  <option>Midday Period 3</option>
                  <option>Afternoon Lab</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5">
                  <p className="text-xs font-medium text-indigo-700">Roster Loaded</p>
                  <p className="text-sm font-bold text-indigo-900">
                    {roster.length} student{roster.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSkipToManual}
                disabled={roster.length === 0}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Skip Camera (Manual Roll Call)
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={roster.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Proceed to Camera
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA CAPTURE */}
        {step === 2 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Step 2: Capture Classroom Photograph
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedClass?.class_name} - Section {selectedSection?.section_name} &middot;{" "}
                  {selectedSubject?.subject_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Change Class
              </button>
            </div>

            {cameraError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-sm text-rose-800">
                  <p className="font-semibold">Camera Access Issue</p>
                  <p className="mt-0.5">{cameraError.message}</p>
                </div>
              </div>
            )}

            <div className="relative aspect-video w-full max-w-3xl mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 flex items-center justify-center">
              {capturedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImage}
                  alt="Captured classroom"
                  className="h-full w-full object-contain bg-slate-900"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={cn(
                      "h-full w-full object-cover",
                      !isStreaming && "hidden"
                    )}
                  />
                  {!isStreaming && (
                    <div className="text-center p-6 text-slate-300 space-y-3">
                      <Camera className="h-12 w-12 mx-auto text-slate-400" />
                      <p className="text-sm font-medium text-white">
                        Camera preview is ready
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Click &ldquo;Open Camera&rdquo; to request permission, or use a sample
                        classroom photo for demonstration.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!capturedImage ? (
                <>
                  {!isStreaming ? (
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Camera className="h-4 w-4" />
                      Open Camera
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Camera className="h-4 w-4" />
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={switchCamera}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <SwitchCamera className="h-4 w-4" />
                        Switch Camera
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setCapturedImage(SAMPLE_CLASSROOM_SVG)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Upload className="h-4 w-4" />
                    Use Sample Photo (Demo)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRunIdentification}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    Confirm &amp; Identify Students
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: AI IDENTIFICATION */}
        {step === 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-semibold">
                  Demonstration AI Matching Mode ({identificationService.getProviderInfo().name})
                </p>
                <p className="mt-0.5">
                  No external biometric API is configured. Results below are simulated candidate
                  matches for workflow demonstration. Teacher verification is required before
                  saving attendance.
                </p>
              </div>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-900">
                  Analyzing classroom photograph...
                </p>
                <p className="text-xs text-slate-500">
                  Comparing detected faces against consented student reference photos.
                </p>
              </div>
            ) : (
              aiResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Faces Detected</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {aiResult.total_faces_detected}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Suggested Matches</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">
                        {aiResult.matches.filter((m) => m.matched_student_id).length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Unidentified Faces</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {aiResult.unidentified_face_ids.length}
                      </p>
                    </div>
                  </div>

                  {aiResult.unidentified_face_ids.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Unidentified Faces — Manual Assignment
                      </h3>
                      {aiResult.unidentified_face_ids.map((faceId) => (
                        <div
                          key={faceId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <span className="text-xs font-medium text-slate-700">
                            Detected Face ({faceId}) &middot; No confident match
                          </span>
                          <select
                            value={unidentifiedAssignments[faceId] ?? ""}
                            onChange={(e) => handleAssignUnidentified(faceId, e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          >
                            <option value="">Assign student manually...</option>
                            {roster.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.roll_number} — {s.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Back to Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Proceed to Verification Table
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* STEP 4: ATTENDANCE VERIFICATION */}
        {step === 4 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Step 4: Verify &amp; Confirm Attendance
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedClass?.class_name} - Section {selectedSection?.section_name} &middot;{" "}
                  {selectedSubject?.subject_name} &middot; {sessionDate}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markAllStatus("present")}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAllStatus("absent")}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Student ID</th>
                    <th className="pb-3 pr-4">Roll No</th>
                    <th className="pb-3 pr-4">AI Match</th>
                    <th className="pb-3 pr-4">Confidence</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Manual Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {getInitials(row.student.full_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {row.student.full_name}
                            </p>
                            {!row.student.photo_consent && (
                              <span className="text-[11px] text-amber-600">
                                Manual only (no photo consent)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                        {row.student.student_code}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{row.student.roll_number}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-medium text-slate-700">
                          {row.ai_matched ? "Suggested (Demo)" : "Manual"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {row.confidence_score ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${row.confidence_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {row.confidence_score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <AttendanceStatusBadge status={row.status} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {(["present", "absent", "late"] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateRowStatus(row.student.id, st)}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs font-medium capitalize border transition-colors",
                                row.status === st
                                  ? st === "present"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : st === "absent"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                {saving ? "Saving..." : "Confirm & Submit Attendance"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SAVED */}
        {step === 5 && savedSummary && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Attendance Recorded Successfully
            </h2>
            <p className="text-sm text-slate-600">
              {savedSummary.total} student attendance entries were saved with unique UUIDs.{" "}
              {savedSummary.synced
                ? "All records are synchronized."
                : "Records are queued in IndexedDB and will sync automatically when online."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCapturedImage(null);
                  setSavedSummary(null);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Take Another Session
              </button>
              <button
                type="button"
                onClick={() => router.push("/attendance/history")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Attendance History
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Final Attendance"
        description={`You are about to submit attendance for ${rows.length} students in ${selectedClass?.class_name}-${selectedSection?.section_name}. ${
          isOnline
            ? "Records will be saved locally and synchronized immediately."
            : "You are offline — records will be stored in IndexedDB and synced when connectivity returns."
        }`}
        confirmLabel="Submit Attendance"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading workflow...</div>}>
      <AttendanceWorkflowContent />
    </Suspense>
  );
}
