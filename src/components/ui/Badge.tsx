import React from "react";
import { cn } from "@/lib/utils/cn";
import { AttendanceStatus } from "@/types/attendance";
import { SyncStatus } from "@/types/database";

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const styles: Record<AttendanceStatus, string> = {
    present: "bg-emerald-50 text-emerald-700 border-emerald-200",
    absent: "bg-rose-50 text-rose-700 border-rose-200",
    late: "bg-amber-50 text-amber-700 border-amber-200",
    unverified: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const labels: Record<AttendanceStatus, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    unverified: "Unverified",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const styles: Record<SyncStatus, string> = {
    synced: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    syncing: "bg-blue-50 text-blue-700 border-blue-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const labels: Record<SyncStatus, string> = {
    synced: "Synced",
    pending: "Pending",
    syncing: "Syncing...",
    failed: "Failed",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "synced" && "bg-emerald-500",
          status === "pending" && "bg-amber-500",
          status === "syncing" && "bg-blue-500 animate-pulse",
          status === "failed" && "bg-rose-500"
        )}
      />
      {labels[status]}
    </span>
  );
}
