"use client";

import React from "react";
import { ShieldCheck, Database, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useOffline } from "@/hooks/useOffline";
import { useSync } from "@/hooks/useSync";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { pendingCount, failedCount, syncedCount } = useSync(isOnline);
  const { showToast } = useToast();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings &amp; Privacy</h1>
          <p className="text-sm text-slate-500">
            Account preferences, offline IndexedDB status, and student photo privacy policies.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Educator Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="font-medium text-slate-900">{user?.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="font-medium capitalize text-slate-900">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Offline Storage &amp; Sync Queue
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Synced</p>
              <p className="text-xl font-bold text-emerald-600">{syncedCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Failed</p>
              <p className="text-xl font-bold text-rose-600">{failedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Student Privacy &amp; Photo Retention Policy
            </h2>
          </div>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
            <li>
              Student reference photographs require explicit parent/guardian consent before
              AI-assisted matching is enabled.
            </li>
            <li>
              Teachers always retain final authority; AI predictions are never treated as
              definitive attendance evidence.
            </li>
            <li>
              Classroom capture images are retained only for verification audits and purged on
              a scheduled retention cycle.
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                showToast({
                  variant: "info",
                  title: "Retention policy acknowledged",
                  description: "Classroom capture retention is set to 30 days.",
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Review Retention Schedule (30 Days)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
