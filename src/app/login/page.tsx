"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  WifiOff,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid school email address."),
  password: z.string().min(4, "Password must be at least 4 characters."),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login, loginAsRole } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "priya.sharma@smartattend.edu",
      password: "password123",
      remember: true,
    },
  });

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    const result = await login(values.email, values.password, values.remember);
    if (!result.ok) {
      setAuthError(result.error ?? "Invalid credentials.");
      return;
    }
    showToast({
      variant: "success",
      title: "Signed in to SmartAttend",
      description: "Welcome back to your classroom dashboard.",
    });
    router.push("/dashboard");
  };

  const handleQuickDemo = (role: "teacher" | "admin") => {
    loginAsRole(role);
    showToast({
      variant: "info",
      title: `Signed in as ${role === "admin" ? "Administrator" : "Teacher"}`,
      description: "Demo session active. Connect Supabase in Phase 2 for live auth.",
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SmartAttend</h1>
            <p className="text-xs text-indigo-100">School Attendance Management PWA</p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Reliable classroom attendance, online or offline.
          </h2>
          <p className="text-indigo-100 text-base leading-relaxed">
            Capture classroom photos, review AI-assisted student matches with full teacher
            verification, and store records safely on-device when connectivity drops.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/15 p-2">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI-Assisted Verification</p>
                <p className="text-xs text-indigo-100">
                  Teachers always hold final authority to verify or override matches.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/15 p-2">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Offline-First IndexedDB Sync</p>
                <p className="text-xs text-indigo-100">
                  Zero lost attendance records during Wi-Fi outages; auto-syncs on reconnect.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/15 p-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Privacy-First Architecture</p>
                <p className="text-xs text-indigo-100">
                  Role-based access control and consent-tracked student photo storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-indigo-200">
          SmartAttend v1.0 &middot; Built for modern schools &amp; educators
        </p>
      </div>

      {/* Right Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">SmartAttend</h1>
              <p className="text-xs text-slate-500">Offline-First Attendance PWA</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Access your classes, attendance records, and sync queue.
              </p>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  School Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="teacher@smartattend.edu"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("remember")}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember session
                </label>
                <span className="text-xs text-slate-400">Role-based access</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Quick Demo Access (Phase 1)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("teacher")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  Teacher Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                >
                  Admin Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
