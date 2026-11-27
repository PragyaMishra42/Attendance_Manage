"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  Users,
  ClipboardList,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOffline } from "@/hooks/useOffline";
import { useSync } from "@/hooks/useSync";
import { useToast } from "@/components/ui/Toast";
import { cn, getInitials } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Take Attendance", href: "/attendance", icon: Camera },
  { label: "Students", href: "/students", icon: Users },
  { label: "Attendance History", href: "/attendance/history", icon: ClipboardList },
  { label: "Classes & Subjects", href: "/classes", icon: BookOpen },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Admin Console", href: "/admin", icon: ShieldCheck, adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings },
];

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    attendance: "Take Attendance",
    history: "Attendance History",
    students: "Students",
    classes: "Classes & Subjects",
    reports: "Reports & Analytics",
    admin: "Admin Console",
    settings: "Settings",
  };
  return segments.map((seg, idx) => ({
    label: labelMap[seg] ?? (seg.startsWith("stu-") ? "Student Profile" : seg),
    href: "/" + segments.slice(0, idx + 1).join("/"),
    isLast: idx === segments.length - 1,
  }));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { isOnline, isOffline, simulatedOffline, toggleSimulatedOffline } = useOffline();
  const { waitingCount, isSyncing, syncNow } = useSync(isOnline);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
            <GraduationCap className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading SmartAttend...</p>
        </div>
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );
  const breadcrumbs = buildBreadcrumbs(pathname);

  const handleManualSync = async () => {
    if (isOffline) {
      showToast({
        variant: "warning",
        title: "Offline mode active",
        description: "Reconnect to the internet to synchronize pending records.",
      });
      return;
    }
    const res = await syncNow();
    showToast({
      variant: res.failed > 0 ? "warning" : "success",
      title: res.synced > 0 ? `Synced ${res.synced} record(s)` : "All records are up to date",
      description:
        res.failed > 0 ? `${res.failed} record(s) failed and will retry.` : undefined,
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:static",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  SmartAttend
                </span>
                <span className="block text-[11px] font-medium text-indigo-600">
                  Offline-First PWA
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/attendance" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-indigo-600" : "text-slate-400"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-slate-50 p-2.5",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {getInitials(user.full_name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.full_name}
                </p>
                <p className="truncate text-xs capitalize text-slate-500">
                  {user.role}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm">
                <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">
                  SmartAttend
                </Link>
                {breadcrumbs.map((crumb) => (
                  <React.Fragment key={crumb.href}>
                    <span className="text-slate-300">/</span>
                    {crumb.isLast ? (
                      <span className="font-semibold text-slate-900">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Connectivity & Sync Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isOffline ? (
                <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                  <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="hidden md:inline">
                    You are offline. Attendance will be saved locally.
                  </span>
                  <span className="md:hidden">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                  <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="hidden md:inline">
                    {waitingCount > 0
                      ? `${waitingCount} record${waitingCount === 1 ? "" : "s"} waiting to sync.`
                      : "Online. All data is up to date."}
                  </span>
                  <span className="md:hidden">
                    {waitingCount > 0 ? `${waitingCount} pending` : "Online"}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                title="Sync pending records now"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>

              <button
                type="button"
                onClick={toggleSimulatedOffline}
                className={cn(
                  "hidden xl:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  simulatedOffline
                    ? "border-amber-300 bg-amber-100 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
                title="Toggle simulated offline mode for testing"
              >
                {simulatedOffline ? "Simulated Offline" : "Test Offline"}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
