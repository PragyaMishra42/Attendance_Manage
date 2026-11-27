"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">You are currently offline</h1>
        <p className="text-sm text-slate-600">
          This page has not been cached yet. You can still return to your dashboard or take
          attendance using locally cached rosters in IndexedDB.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
